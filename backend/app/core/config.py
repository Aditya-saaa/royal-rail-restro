"""Application configuration via environment variables."""

from functools import lru_cache
from typing import List
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Ensure async SQLAlchemy URL works with Neon / Render Postgres."""
    if not url:
        return url
    # Force async driver
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    # asyncpg uses ssl=require, not sslmode=require
    if "sslmode" in query:
        mode = query.pop("sslmode")
        if mode and mode != "disable" and "ssl" not in query:
            query["ssl"] = "require" if mode in ("require", "verify-ca", "verify-full") else mode
    # Neon / Render typically need SSL
    host = (parsed.hostname or "").lower()
    if any(h in host for h in ("neon.tech", "render.com", "amazonaws.com")) and "ssl" not in query:
        query["ssl"] = "require"
    new_query = urlencode(query)
    return urlunparse(parsed._replace(query=new_query))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Royal Rail Restro"
    app_env: str = "development"
    app_debug: bool = False
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
    # When true, reflect request Origin (safe for multi-preview Vercel deploys).
    # Off by default — turn on explicitly only if you need to accept requests
    # from arbitrary preview-deployment origins.
    cors_allow_all: bool = False

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

    # Optional shared secret to reseed without admin login (set on Render)
    seed_secret: str = ""

    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: str | None = None

    @field_validator("app_debug", "cors_allow_all", mode="before")
    @classmethod
    def parse_bool(cls, v: object) -> bool:
        if isinstance(v, str):
            return v.lower() in ("1", "true", "yes", "on")
        return bool(v)

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_database_url(cls, v: object) -> object:
        if isinstance(v, str):
            return normalize_database_url(v)
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    # Values shipped as the dev/demo defaults — never acceptable in production.
    _DEFAULT_SECRET_KEY = "dev-only-change-in-production-min-32-chars!!"
    _DEFAULT_ADMIN_PASSWORD = "Admin@RRR2026!"

    def assert_safe_for_env(self) -> None:
        """Guard against the most common "forgot to configure prod" mistakes.

        Raises at startup if APP_ENV=production is set but the app is still
        using default secrets — better to fail loudly at boot than to silently
        run production traffic with a public/guessable JWT signing key or
        admin password. Non-production environments only get a warning so
        local/dev/staging setups keep working without extra config.
        """
        problems = []
        if self.secret_key == self._DEFAULT_SECRET_KEY:
            problems.append("SECRET_KEY is still the default dev value")
        if self.admin_password == self._DEFAULT_ADMIN_PASSWORD:
            problems.append("ADMIN_PASSWORD is still the default dev value")
        if self.app_debug and self.is_production:
            problems.append("APP_DEBUG=true while APP_ENV=production (leaks internals in error responses)")
        if self.cors_allow_all and self.is_production:
            problems.append("CORS_ALLOW_ALL=true while APP_ENV=production (reflects any origin)")

        if not problems:
            return

        message = "Insecure configuration detected: " + "; ".join(problems)
        if self.is_production:
            raise RuntimeError(f"{message}. Refusing to start with APP_ENV=production.")
        print(f"[config] WARNING: {message}. This is fine for local dev, but must be fixed before deploying.")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
settings.assert_safe_for_env()
