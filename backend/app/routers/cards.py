from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services import llm

router = APIRouter(prefix="/cards", tags=["cards"])

# Same Leitner scheme as the frontend: box 1..5, interval in days per box,
# "again" always resets to box 1 / due today.
LEITNER_DAYS = {1: 1, 2: 2, 3: 4, 4: 8, 5: 16}


@router.get("/", response_model=list[schemas.CardOut])
def list_cards(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Card)
        .filter(models.Card.owner_id == current_user.id)
        .order_by(models.Card.due_date)
        .all()
    )


@router.post("/", response_model=schemas.CardOut)
def create_card(
    card: schemas.CardCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    embedding = llm.get_embedding(f"{card.front} {card.back}")
    db_card = models.Card(**card.model_dump(), embedding=embedding, owner_id=current_user.id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


def _get_owned_or_404(db: Session, card_id: UUID, user: models.User) -> models.Card:
    card = (
        db.query(models.Card)
        .filter(models.Card.id == card_id, models.Card.owner_id == user.id)
        .first()
    )
    if not card:
        raise HTTPException(404, "Karte nicht gefunden")
    return card


@router.put("/{card_id}", response_model=schemas.CardOut)
def update_card(
    card_id: UUID,
    payload: schemas.CardUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    card = _get_owned_or_404(db, card_id, current_user)
    for field, value in payload.model_dump().items():
        setattr(card, field, value)
    card.embedding = llm.get_embedding(f"{card.front} {card.back}")
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=204)
def delete_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    card = _get_owned_or_404(db, card_id, current_user)
    db.delete(card)
    db.commit()


@router.post("/{card_id}/review", response_model=schemas.CardOut)
def review_card(
    card_id: UUID,
    payload: schemas.ReviewRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    card = _get_owned_or_404(db, card_id, current_user)

    if payload.rating == "again":
        card.box = 1
        card.due_date = date.today()
    elif payload.rating == "good":
        card.box = min(5, card.box + 1)
        card.due_date = date.today() + timedelta(days=LEITNER_DAYS[card.box])
    elif payload.rating == "easy":
        card.box = min(5, card.box + 2)
        card.due_date = date.today() + timedelta(days=LEITNER_DAYS[card.box])
    else:
        raise HTTPException(422, "rating muss again, good oder easy sein")

    db.commit()
    db.refresh(card)
    return card
