from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/karteikasten"

    # LLM — any OpenAI-compatible cloud API. Leave LLM_BASE_URL empty to use
    # the provider's default endpoint. A local model (Ollama) can be plugged
    # in later by pointing LLM_BASE_URL at it, but is not the default here —
    # quality for German generation was not reliable enough in testing.
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""
    LLM_MODEL: str = "gpt-4o-mini"

    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536  # must match the embedding model's output size

    CORS_ORIGINS: list[str] = ["http://localhost:8080", "http://127.0.0.1:8080"]

    # JWT auth. SECRET_KEY MUST be overridden in .env for anything beyond
    # local dev — generate one with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "dev-only-insecure-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week — personal-use app, not high-security

    class Config:
        env_file = ".env"


settings = Settings()
