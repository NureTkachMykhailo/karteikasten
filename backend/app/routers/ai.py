import json
import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services import llm

router = APIRouter(prefix="/ai", tags=["ai"])

# Cosine distance below this = close enough to flag as a likely duplicate.
# Tune this against real data once the catalog has enough cards to test.
SIMILARITY_THRESHOLD = 0.15


def _parse_json_draft(raw: str) -> dict:
    """
    OpenAI's json_mode should already guarantee valid JSON, but this stays
    as a defensive fallback — e.g. if LLM_BASE_URL later points at a
    provider that ignores response_format and wraps the answer in a
    ```json ... ``` code fence anyway.
    """
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


@router.post("/generate-card", response_model=schemas.GenerateCardResponse)
def generate_card(
    req: schemas.GenerateCardRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    RAG step: embed the topic, pull the 5 nearest existing cards (from this
    user's own catalog only), and give those to the LLM as context — so the
    draft matches the user's existing style/level and doesn't quietly
    duplicate something already there. The draft is returned for review,
    not saved automatically; saving happens through POST /cards/ once the
    user accepts it.
    """
    query_embedding = llm.get_embedding(req.topic)

    similar_rows = (
        db.query(models.Card, models.Card.embedding.cosine_distance(query_embedding).label("distance"))
        .filter(models.Card.owner_id == current_user.id)
        .order_by("distance")
        .limit(5)
        .all()
    )
    similar = [row[0] for row in similar_rows]
    possible_duplicate = bool(similar_rows) and similar_rows[0].distance < SIMILARITY_THRESHOLD

    context = "\n".join(f"- {c.front} — {c.back} ({c.level})" for c in similar) or "(catalog is empty so far)"

    system = (
        "You help build a German vocabulary catalog. First check whether the "
        "given topic is a meaningful German word, phrase, or learning topic. "
        "Minor typos or informal phrasing are fine — correct them silently. "
        "But if the input is gibberish, random characters, or has nothing to "
        "do with language learning, do NOT invent a card for it.\n\n"
        "Respond with ONLY a JSON object, no text outside it:\n"
        '- If valid: {"front", "back", "example", "note", '
        '"type": one of Wort|Verb|Phrase|Grammatik, "level": one of A1|A2|B1|B2|C1}. '
        "back/note/example must be in German except back, which is the English "
        "translation. Match the style and level of the existing cards below and "
        "do not duplicate them.\n"
        '- If NOT valid: {"error": "<short reason, written in German>"}'
    )
    user = f"Existing similar cards:\n{context}\n\nTopic: {req.topic}"

    raw = llm.chat_completion(system, user, json_mode=True)
    try:
        result = _parse_json_draft(raw)
    except json.JSONDecodeError:
        raise HTTPException(502, "Die KI hat ungültiges JSON zurückgegeben — bitte erneut versuchen")

    if "error" in result:
        return schemas.GenerateCardResponse(
            rejected=True,
            rejection_reason=result["error"],
            similar_cards=[schemas.CardOut.model_validate(c) for c in similar],
        )

    return schemas.GenerateCardResponse(
        draft=result,
        similar_cards=[schemas.CardOut.model_validate(c) for c in similar],
        possible_duplicate=possible_duplicate,
    )


@router.post("/generate-dialogue", response_model=schemas.GenerateDialogueResponse)
def generate_dialogue(
    req: schemas.GenerateDialogueRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    No embeddings here on purpose — selecting "which cards to practice" is a
    plain filter (tag / level / due today), not a semantic search problem.
    """
    query = db.query(models.Card).filter(models.Card.owner_id == current_user.id)
    if req.tags:
        query = query.filter(models.Card.tags.overlap(req.tags))
    if req.level:
        query = query.filter(models.Card.level == req.level)
    if req.due_today:
        query = query.filter(models.Card.due_date <= date.today())

    words = query.limit(req.limit).all()
    if not words:
        raise HTTPException(404, "Keine Karten für diese Filter gefunden")

    word_list = ", ".join(w.front for w in words)
    system = (
        "You help build a German learning tool. Write a short, natural German "
        "dialogue (4-8 lines, alternating A/B) using EVERY listed word at least "
        "once, plus a line-by-line English translation. "
        'Respond with ONLY a JSON object: {"dialogue_de": "...", "dialogue_en": "..."}. '
        "Each value is the plain dialogue text with line breaks between turns — "
        "no markdown, no asterisks, no headers, no extra commentary."
    )
    user = f"Words to include: {word_list}"

    raw = llm.chat_completion(system, user, json_mode=True)
    try:
        result = _parse_json_draft(raw)
    except json.JSONDecodeError:
        raise HTTPException(502, "Die KI hat ungültiges JSON zurückgegeben — bitte erneut versuchen")

    return schemas.GenerateDialogueResponse(
        dialogue_de=result.get("dialogue_de", ""),
        dialogue_en=result.get("dialogue_en", ""),
        used_cards=[schemas.CardOut.model_validate(w) for w in words],
    )
