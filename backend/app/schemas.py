import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from .models import CardType, CEFRLevel


class CardBase(BaseModel):
    front: str
    back: str
    example: str = ""
    note: str = ""
    type: CardType = CardType.wort
    level: CEFRLevel = CEFRLevel.a1
    tags: list[str] = []


class CardCreate(CardBase):
    """box and due_date are not client-settable — new cards always start
    in box 1, due today. They only change through the review endpoint
    (not included in this skeleton — same Leitner logic as the frontend demo)."""


class CardOut(CardBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    box: int
    due_date: date
    created_at: datetime


class CardUpdate(CardBase):
    """Full replace of the editable fields — box/due_date only change via /review."""


class ReviewRequest(BaseModel):
    rating: str  # "again" | "good" | "easy"


# --- AI: card generation -------------------------------------------------


class GenerateCardRequest(BaseModel):
    topic: str  # e.g. a German word, a phrase, or a short topic description


class GenerateCardResponse(BaseModel):
    draft: dict | None = None  # None when the topic was rejected as not meaningful
    similar_cards: list[CardOut] = []  # top-5 nearest existing cards, for the user to review
    possible_duplicate: bool = False  # nearest card is closer than SIMILARITY_THRESHOLD
    rejected: bool = False
    rejection_reason: str | None = None  # set when rejected — in German, shown directly in the UI


# --- AI: dialogue generation ----------------------------------------------


class GenerateDialogueRequest(BaseModel):
    tags: list[str] = []
    level: CEFRLevel | None = None
    due_today: bool = False
    limit: int = 8


class GenerateDialogueResponse(BaseModel):
    dialogue_de: str
    dialogue_en: str
    used_cards: list[CardOut]


# --- Auth ------------------------------------------------------------------


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
