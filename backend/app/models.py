import enum
import uuid
from datetime import date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from .config import settings
from .database import Base


class CardType(str, enum.Enum):
    wort = "Wort"
    verb = "Verb"
    phrase = "Phrase"
    grammatik = "Grammatik"


class CEFRLevel(str, enum.Enum):
    a1 = "A1"
    a2 = "A2"
    b1 = "B1"
    b2 = "B2"
    c1 = "C1"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Card(Base):
    """
    A single catalog entry, owned by exactly one user — every query in
    routers/cards.py and routers/ai.py filters by owner_id so users only
    ever see their own catalog. `embedding` is populated on create (see
    services/llm.py) and used only by /ai/generate-card for the
    duplicate/style-similarity check — it is not exposed to the client.
    """

    __tablename__ = "cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    front = Column(String(255), nullable=False)
    back = Column(String(255), nullable=False)
    example = Column(Text, default="")
    note = Column(Text, default="")
    type = Column(Enum(CardType), nullable=False, default=CardType.wort)
    level = Column(Enum(CEFRLevel), nullable=False, default=CEFRLevel.a1)
    tags = Column(ARRAY(String), default=list)

    # Leitner state
    box = Column(Integer, nullable=False, default=1)  # 1..5
    due_date = Column(Date, nullable=False, default=date.today)

    embedding = Column(Vector(settings.EMBEDDING_DIM), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
