from tests.conftest import register_and_login


def test_register_login_and_me(client):
    email = "student@uni.de"
    resp = client.post("/auth/register", json={"email": email, "password": "correcthorse"})
    assert resp.status_code == 200
    assert resp.json()["email"] == email

    resp = client.post("/auth/login", json={"email": email, "password": "correcthorse"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == email


def test_duplicate_email_is_rejected(client):
    payload = {"email": "dup@example.de", "password": "correcthorse"}
    assert client.post("/auth/register", json=payload).status_code == 200
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 400


def test_wrong_password_is_rejected(client):
    email = "wrongpass@example.de"
    client.post("/auth/register", json={"email": email, "password": "correcthorse"})
    resp = client.post("/auth/login", json={"email": email, "password": "not-it"})
    assert resp.status_code == 401


def test_login_unknown_email_is_rejected(client):
    resp = client.post("/auth/login", json={"email": "nobody@example.de", "password": "x"})
    assert resp.status_code == 401


def test_me_requires_a_token(client):
    assert client.get("/auth/me").status_code in (401, 403)


def test_me_rejects_garbage_token(client):
    resp = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert resp.status_code == 401


def test_protected_card_routes_require_a_token(client):
    assert client.get("/cards/").status_code in (401, 403)
    assert client.post("/cards/", json={"front": "x", "back": "y"}).status_code in (401, 403)


def test_register_and_login_helper_round_trips(client):
    headers = register_and_login(client)
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
