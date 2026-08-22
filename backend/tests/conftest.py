import os

# Must happen before `app.config.settings` (or anything importing it) loads —
# pydantic-settings reads real env vars ahead of backend/.env, so this
# redirects the whole app at a throwaway test database and dummy secrets
# without touching the developer's own .env.
os.environ.setdefault(
    "DATABASE_URL", "postgresql://karteikasten:karteikasten@localhost:55432/karteikasten_test"
)
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("LLM_API_KEY", "test-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "")

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import engine
from app.main import app

FAKE_EMBEDDING = [1.0] + [0.0] * 1535  # non-zero norm — pgvector cosine_distance(0,0) is undefined


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c
    # Wipe both tables between tests so cases don't see each other's rows.
    # TRUNCATE ... CASCADE is enough here — schema itself is left in place.
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE cards, users CASCADE"))
        conn.commit()


@pytest.fixture(autouse=True)
def _mock_llm(monkeypatch):
    """
    No test should ever reach the real OpenAI-compatible API — these are
    the two call sites used across routers/ai.py and routers/cards.py.
    """
    from app.services import llm

    monkeypatch.setattr(llm, "get_embedding", lambda text, lang="de": list(FAKE_EMBEDDING))
    monkeypatch.setattr(
        llm,
        "chat_completion",
        lambda system, user, json_mode=False, lang="de": '{"error": "not stubbed for this test"}',
    )


def register_and_login(client, email: str | None = None, password: str = "hunter2pass") -> dict:
    """Returns Authorization headers for a freshly registered user."""
    email = email or f"user-{uuid.uuid4().hex[:8]}@example.de"
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
