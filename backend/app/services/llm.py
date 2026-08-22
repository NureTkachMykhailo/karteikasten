"""
Thin wrapper around an OpenAI-compatible chat + embeddings API.

Kept deliberately simple (no LangChain): there are only two call sites
(generate-card, generate-dialogue) and one embedding call on card create,
so a direct client is easier to read and to defend than a chain framework.

To swap providers, change LLM_BASE_URL / LLM_MODEL / EMBEDDING_MODEL in
.env — no code changes needed as long as the provider is OpenAI-compatible.
"""

import openai
from fastapi import HTTPException

from ..config import settings
from ..lang import Lang, msg

_client = openai.OpenAI(
    api_key=settings.LLM_API_KEY,
    base_url=settings.LLM_BASE_URL or None,
)


def _friendly_error(err: openai.OpenAIError, lang: Lang) -> HTTPException:
    """
    Turns an OpenAI SDK error into an HTTPException with a clear message in
    the caller's UI language. Important beyond just readability: an
    *unhandled* exception here can reach the client without CORS headers
    attached (FastAPI's default error path bypasses the CORS middleware),
    which the browser then reports as a generic "Failed to fetch" — masking
    the real cause. Always raising HTTPException keeps the response inside
    normal exception handling, so CORS headers are preserved.
    """
    if isinstance(err, openai.AuthenticationError):
        return HTTPException(502, msg("llm_auth_error", lang))
    if isinstance(err, openai.RateLimitError):
        return HTTPException(502, msg("llm_rate_limit", lang))
    if isinstance(err, openai.APIConnectionError):
        return HTTPException(502, msg("llm_connection_error", lang))
    return HTTPException(502, f"{msg('llm_generic_error', lang)}: {err}")


def get_embedding(text: str, lang: Lang = "de") -> list[float]:
    try:
        response = _client.embeddings.create(model=settings.EMBEDDING_MODEL, input=text)
    except openai.OpenAIError as err:
        raise _friendly_error(err, lang) from err
    return response.data[0].embedding


def chat_completion(system: str, user: str, json_mode: bool = False, lang: Lang = "de") -> str:
    kwargs = {}
    if json_mode:
        # Forces the API itself to guarantee a syntactically valid JSON
        # object — needed for generate-card, where we parse the response.
        # Note: the prompt must still mention "JSON" for this mode to apply.
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = _client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.4,
            **kwargs,
        )
    except openai.OpenAIError as err:
        raise _friendly_error(err, lang) from err
    return response.choices[0].message.content
