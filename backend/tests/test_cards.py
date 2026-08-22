from datetime import date, timedelta

from tests.conftest import register_and_login


def _create_card(client, headers, **overrides):
    payload = {"front": "der Termin", "back": "appointment", "example": "", "note": "", "tags": []}
    payload.update(overrides)
    resp = client.post("/cards/", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_create_and_list_card(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    assert card["box"] == 1
    assert card["due_date"] == date.today().isoformat()

    resp = client.get("/cards/", headers=headers)
    assert resp.status_code == 200
    assert [c["id"] for c in resp.json()] == [card["id"]]


def test_update_card(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    payload = {
        "front": "die Verabredung",
        "back": "date/appointment",
        "example": "",
        "note": "",
        "tags": ["Alltag"],
    }
    resp = client.put(f"/cards/{card['id']}", json=payload, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["front"] == "die Verabredung"
    assert resp.json()["tags"] == ["Alltag"]


def test_delete_card(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    assert client.delete(f"/cards/{card['id']}", headers=headers).status_code == 204
    assert client.get("/cards/", headers=headers).json() == []


def test_review_again_resets_to_box_one(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    resp = client.post(f"/cards/{card['id']}/review", json={"rating": "again"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["box"] == 1
    assert resp.json()["due_date"] == date.today().isoformat()


def test_review_good_advances_one_box(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    resp = client.post(f"/cards/{card['id']}/review", json={"rating": "good"}, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["box"] == 2
    assert body["due_date"] == (date.today() + timedelta(days=2)).isoformat()


def test_review_easy_advances_two_boxes(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    resp = client.post(f"/cards/{card['id']}/review", json={"rating": "easy"}, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["box"] == 3
    assert body["due_date"] == (date.today() + timedelta(days=4)).isoformat()


def test_review_box_never_exceeds_five(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    card_id = card["id"]
    for _ in range(4):
        resp = client.post(f"/cards/{card_id}/review", json={"rating": "easy"}, headers=headers)
    assert resp.json()["box"] == 5
    resp = client.post(f"/cards/{card_id}/review", json={"rating": "easy"}, headers=headers)
    assert resp.json()["box"] == 5
    assert resp.json()["due_date"] == (date.today() + timedelta(days=16)).isoformat()


def test_review_rejects_invalid_rating(client):
    headers = register_and_login(client)
    card = _create_card(client, headers)
    resp = client.post(f"/cards/{card['id']}/review", json={"rating": "meh"}, headers=headers)
    assert resp.status_code == 422


def test_card_crud_is_isolated_per_user(client):
    headers_a = register_and_login(client)
    headers_b = register_and_login(client)
    card = _create_card(client, headers_a)

    assert client.get("/cards/", headers=headers_b).json() == []

    resp = client.put(
        f"/cards/{card['id']}",
        json={"front": "x", "back": "y", "example": "", "note": "", "tags": []},
        headers=headers_b,
    )
    assert resp.status_code == 404

    assert client.delete(f"/cards/{card['id']}", headers=headers_b).status_code == 404
    resp = client.post(f"/cards/{card['id']}/review", json={"rating": "good"}, headers=headers_b)
    assert resp.status_code == 404

    # owner is unaffected by the other user's rejected attempts
    resp = client.get("/cards/", headers=headers_a)
    assert len(resp.json()) == 1
