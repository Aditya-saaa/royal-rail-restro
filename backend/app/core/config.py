"""Application configuration via environment variables."""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Royal Rail Restro"
    app_env: str = "development"
    app_debug: bool = True
    app_url: str = "http://localhost:5173"
    api_url: str = "http://localhost:8000"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field(
        default="dev-only-change-in-production-min-32-chars!!"
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    database_url: str = (
        "postgresql+asyncpg://rrr_user:rrr_secure_password_2026@"
        "localhost:5432/royal_rail_restro"
    )
    database_url_sync: str = (
        "postgresql://rrr_user:rrr_secure_password_2026@"
        "localhost:5432/royal_rail_restro"
    )

    redis_url: str = "redis://localhost:6379/0"

    cors_origins: str = (
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    )

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@royalrailrestro.com"

    rate_limit_default: str = "100/minute"

    restaurant_name: str = "Royal Rail Restro"
    restaurant_phone: str = "+91-XXXXXXXXXX"
    restaurant_email: str = "info@royalrailrestro.com"
    restaurant_address: str = (
        "1st Floor, Dev Raj Tower, Gewalbigha, Gaya, Bihar, India"
    )
    restaurant_lat: float = 24.7955
    restaurant_lng: float = 85.0002
    gst_percent: float = 5.0
    currency: str = "INR"

    admin_email: str = "admin@royalrailrestro.com"
    admin_password: str = "Admin@RRR2026!"
    admin_name: str = "Platform Admin"

    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: str | None = None

    @field_validator("app_debug", mode="before")
    @classmethod
    def parse_debug(cls, v: object) -> bool:
        if isinstance(v, str):
            return v.lower() in ("1", "true", "yes", "on")
        return bool(v)

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
