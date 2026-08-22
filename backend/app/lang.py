from typing import Literal

from fastapi import Header

Lang = Literal["de", "en"]


def get_lang(x_lang: str | None = Header(default=None)) -> Lang:
    return "en" if x_lang == "en" else "de"


_MESSAGES = {
    "invalid_json": {
        "de": "Die KI hat ungültiges JSON zurückgegeben — bitte erneut versuchen",
        "en": "The AI returned invalid JSON — please try again",
    },
    "no_cards_for_filter": {
        "de": "Keine Karten für diese Filter gefunden",
        "en": "No cards found for these filters",
    },
    "card_not_found": {
        "de": "Karte nicht gefunden",
        "en": "Card not found",
    },
    "invalid_rating": {
        "de": "rating muss again, good oder easy sein",
        "en": "rating must be again, good, or easy",
    },
    "email_taken": {
        "de": "Diese E-Mail ist bereits registriert",
        "en": "This email is already registered",
    },
    "bad_credentials": {
        "de": "E-Mail oder Passwort ist falsch",
        "en": "Email or password is incorrect",
    },
    "google_not_configured": {
        "de": "Google-Login ist auf diesem Server nicht konfiguriert",
        "en": "Google sign-in is not configured on this server",
    },
    "google_invalid_token": {
        "de": "Ungültiges Google-Token",
        "en": "Invalid Google token",
    },
    "google_unverified_email": {
        "de": "Google-Konto hat keine bestätigte E-Mail",
        "en": "Google account has no verified email",
    },
    "llm_auth_error": {
        "de": "KI-Anfrage fehlgeschlagen: LLM_API_KEY ist ungültig oder fehlt (backend/.env prüfen)",
        "en": "AI request failed: LLM_API_KEY is invalid or missing (check backend/.env)",
    },
    "llm_rate_limit": {
        "de": "KI-Anfrage fehlgeschlagen: Kontingent/Guthaben beim LLM-Anbieter aufgebraucht",
        "en": "AI request failed: quota/credit exhausted with the LLM provider",
    },
    "llm_connection_error": {
        "de": "KI-Anfrage fehlgeschlagen: LLM-Anbieter nicht erreichbar",
        "en": "AI request failed: could not reach the LLM provider",
    },
    "llm_generic_error": {
        "de": "KI-Anfrage fehlgeschlagen",
        "en": "AI request failed",
    },
}


def msg(key: str, lang: Lang) -> str:
    return _MESSAGES[key][lang]
