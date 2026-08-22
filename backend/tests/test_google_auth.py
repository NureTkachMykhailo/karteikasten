"""
Google sign-in is exercised entirely against a stubbed verify_oauth2_token —
no test should reach Google's servers.
"""

import pytest


@pytest.fixture()
def google_configured(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")


def _stub_token(monkeypatch, *, email, verified=True):
    from app.routers import auth as auth_router

    def fake_verify(token, request, audience):
        return {"email": email, "email_verified": verified}

    monkeypatch.setattr(auth_router.google_id_token, "verify_oauth2_token", fake_verify)


def test_google_login_creates_new_user(client, google_configured, monkeypatch):
    _stub_token(monkeypatch, email="new.googler@example.de")
    resp = client.post("/auth/google", json={"id_token": "whatever"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "new.googler@example.de"


def test_google_login_reuses_existing_account(client, google_configured, monkeypatch):
    _stub_token(monkeypatch, email="returning@example.de")
    first = client.post("/auth/google", json={"id_token": "t1"})
    second = client.post("/auth/google", json={"id_token": "t2"})
    assert first.status_code == second.status_code == 200

    def whoami(resp):
        token = resp.json()["access_token"]
        return client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).json()["id"]

    assert whoami(first) == whoami(second)


def test_password_login_blocked_for_google_only_account(client, google_configured, monkeypatch):
    _stub_token(monkeypatch, email="google.only@example.de")
    client.post("/auth/google", json={"id_token": "t1"})

    resp = client.post("/auth/login", json={"email": "google.only@example.de", "password": "anything"})
    assert resp.status_code == 401


def test_google_unverified_email_is_rejected(client, google_configured, monkeypatch):
    _stub_token(monkeypatch, email="unverified@example.de", verified=False)
    resp = client.post("/auth/google", json={"id_token": "t1"})
    assert resp.status_code == 401


def test_google_invalid_token_is_rejected(client, google_configured, monkeypatch):
    from app.routers import auth as auth_router

    def fake_verify(token, request, audience):
        raise ValueError("bad token")

    monkeypatch.setattr(auth_router.google_id_token, "verify_oauth2_token", fake_verify)
    resp = client.post("/auth/google", json={"id_token": "garbage"})
    assert resp.status_code == 401


def test_google_login_disabled_without_client_id(client):
    resp = client.post("/auth/google", json={"id_token": "whatever"})
    assert resp.status_code == 501
