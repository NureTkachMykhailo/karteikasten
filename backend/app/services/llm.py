"""
Thin wrapper around an OpenAI-compatible chat + embeddings API.

Kept deliberately simple (no LangChain): there are only two call sites
(generate-card, generate-dialogue) and one embedding call on card create,
so a direct client is easier to read and to defend than a chain framework.

To swap providers, change LLM_BASE_URL / LLM_MODEL / EMBEDDING_MODEL in
.env — no code changes needed as long as the provider is OpenAI-compatible.
"""

from openai import OpenAI

from ..config import settings

_client = OpenAI(
    api_key=settings.LLM_API_KEY,
    base_url=settings.LLM_BASE_URL or None,
)


def get_embedding(text: str) -> list[float]:
    response = _client.embeddings.create(model=settings.EMBEDDING_MODEL, input=text)
    return response.data[0].embedding


def chat_completion(system: str, user: str, json_mode: bool = False) -> str:
    kwargs = {}
    if json_mode:
        # Forces the API itself to guarantee a syntactically valid JSON
        # object — needed for generate-card, where we parse the response.
        # Note: the prompt must still mention "JSON" for this mode to apply.
        kwargs["response_format"] = {"type": "json_object"}

    response = _client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.4,
        **kwargs,
    )
    return response.choices[0].message.content
