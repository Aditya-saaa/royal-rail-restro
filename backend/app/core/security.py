"""JWT, password hashing, and token utilities."""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(
    subject: str,
    extra: Optional[dict[str, Any]] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "type": "access",
        "jti": str(uuid4()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(
        payload, settings.secret_key, algorithm=settings.jwt_algorithm
    )


def create_refresh_token(
    subject: str,
    extra: Optional[dict[str, Any]] = None,
    expires_days: Optional[int] = None,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=expires_days or settings.refresh_token_expire_days
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid4()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(
        payload, settings.secret_key, algorithm=settings.jwt_algorithm
    )


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token, settings.secret_key, algorithms=[settings.jwt_algorithm]
    )


def create_password_reset_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {"sub": email, "exp": expire, "type": "password_reset"}
    return jwt.encode(
        payload, settings.secret_key, algorithm=settings.jwt_algorithm
    )


def create_email_verify_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=2)
    payload = {"sub": email, "exp": expire, "type": "email_verify"}
    return jwt.encode(
        payload, settings.secret_key, algorithm=settings.jwt_algorithm
    )


def verify_special_token(token: str, expected_type: str) -> Optional[str]:
    try:
        payload = decode_token(token)
        if payload.get("type") != expected_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None
