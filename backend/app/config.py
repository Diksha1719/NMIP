from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./nmip.db"
    jwt_secret: str
    cors_origins: str = "http://localhost:3000"
    cookie_secure: bool = False
    embedding_provider: str = "deterministic"
    sentence_transformer_model: str = "all-MiniLM-L6-v2"
    seed_demo: bool = False
    demo_password: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
if len(settings.jwt_secret) < 32:
    raise ValueError("JWT_SECRET must contain at least 32 characters")
