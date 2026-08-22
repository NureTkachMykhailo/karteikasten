import json

from tests.conftest import register_and_login


def _create_card(client, headers, **overrides):
    payload = {"front": "der Termin", "back": "appointment", "example": "", "note": "", "tags": ["Alltag"]}
    payload.update(overrides)
    resp = client.post("/cards/", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_generate_card_success(client, monkeypatch):
    from app.services import llm

    draft = {
        "front": "die Verabredung",
        "back": "appointment",
        "example": "Ich habe eine Verabredung.",
        "note": "feminin",
        "type": "Wort",
        "level": "A1",
    }
    monkeypatch.setattr(llm, "chat_completion", lambda *a, **kw: json.dumps(draft))

    headers = register_and_login(client)
    resp = client.post("/ai/generate-card", json={"topic": "die Verabredung"}, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["rejected"] is False
    assert body["draft"]["front"] == "die Verabredung"


def test_generate_card_flags_close_duplicate(client, monkeypatch):
    from app.services import llm

    headers = register_and_login(client)
    _create_card(client, headers, front="der Termin", back="appointment")

    draft = {
        "front": "der Termin",
        "back": "appointment",
        "example": "",
        "note": "",
        "type": "Wort",
        "level": "A1",
    }
    monkeypatch.setattr(llm, "chat_completion", lambda *a, **kw: json.dumps(draft))

    resp = client.post("/ai/generate-card", json={"topic": "der Termin"}, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["possible_duplicate"] is True
    assert len(body["similar_cards"]) == 1


def test_generate_card_rejected_by_llm(client, monkeypatch):
    from app.services import llm

    monkeypatch.setattr(llm, "chat_completion", lambda *a, **kw: json.dumps({"error": "not a German word"}))

    headers = register_and_login(client)
    resp = client.post("/ai/generate-card", json={"topic": "asdkjhasd"}, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["rejected"] is True
    assert body["rejection_reason"] == "not a German word"
    assert body["draft"] is None


def test_generate_card_invalid_json_returns_502(client, monkeypatch):
    from app.services import llm

    monkeypatch.setattr(llm, "chat_completion", lambda *a, **kw: "not json at all")

    headers = register_and_login(client)
    resp = client.post("/ai/generate-card", json={"topic": "der Termin"}, headers=headers)
    assert resp.status_code == 502


def test_generate_dialogue_uses_filtered_cards(client, monkeypatch):
    from app.services import llm

    headers = register_and_login(client)
    _create_card(client, headers, front="der Termin", back="appointment", tags=["Alltag"])
    _create_card(client, headers, front="die Rechnung", back="invoice", tags=["Büro"])

    dialogue = {
        "dialogue_de": "A: Hast du einen Termin?\nB: Ja, um 10 Uhr.",
        "dialogue_en": "A: Do you have an appointment?\nB: Yes, at 10.",
    }
    monkeypatch.setattr(llm, "chat_completion", lambda *a, **kw: json.dumps(dialogue))

    resp = client.post("/ai/generate-dialogue", json={"tags": ["Alltag"]}, headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["used_cards"]) == 1
    assert body["used_cards"][0]["front"] == "der Termin"
    assert "Termin" in body["dialogue_de"]


def test_generate_dialogue_normalizes_missing_linebreaks(client, monkeypatch):
    from app.services import llm

    headers = register_and_login(client)
    _create_card(client, headers)

    dialogue = {
        "dialogue_de": "A: Hallo!B: Hallo, wie geht's?",
        "dialogue_en": "A: Hi!B: Hi, how are you?",
    }
    monkeypatch.setattr(llm, "chat_completion", lambda *a, **kw: json.dumps(dialogue))

    resp = client.post("/ai/generate-dialogue", json={}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["dialogue_de"] == "A: Hallo!\nB: Hallo, wie geht's?"


def test_generate_dialogue_404_when_no_cards_match(client):
    headers = register_and_login(client)
    resp = client.post("/ai/generate-dialogue", json={"tags": ["nonexistent"]}, headers=headers)
    assert resp.status_code == 404


def test_ai_endpoints_require_auth(client):
    assert client.post("/ai/generate-card", json={"topic": "x"}).status_code in (401, 403)
    assert client.post("/ai/generate-dialogue", json={}).status_code in (401, 403)
