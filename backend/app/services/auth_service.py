"""Authentication business logic."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_email_verify_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    verify_special_token,
)
from app.models.customer import Customer
from app.models.user import Role, User
from app.schemas.auth import SignupRequest, TokenResponse
from app.utils.helpers import generate_referral_code


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def signup(self, data: SignupRequest) -> User:
        existing = await self.get_user_by_email(data.email)
        if existing:
            raise ValueError("Email already registered")

        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            full_name=data.full_name.strip(),
            phone=data.phone,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        await self.db.flush()

        # Assign customer role
        role_result = await self.db.execute(select(Role).where(Role.name == "customer"))
        customer_role = role_result.scalar_one_or_none()
        if customer_role:
            # Explicit association insert — avoid lazy relationship mutation
            from app.models.user import UserRole

            self.db.add(UserRole(user_id=user.id, role_id=customer_role.id))
            await self.db.flush()
        customer = Customer(
            user_id=user.id,
            referral_code=generate_referral_code(),
        )
        self.db.add(customer)
        await self.db.flush()
        # Reload with roles for response
        return await self.get_user_by_id(user.id)

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.get_user_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")

        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise ValueError("Account temporarily locked. Try again later.")

        if not verify_password(password, user.password_hash):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            await self.db.flush()
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account is deactivated")

        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.now(timezone.utc)
        await self.db.flush()
        return user

    def issue_tokens(self, user: User, remember_me: bool = False) -> TokenResponse:
        roles = [r.name for r in user.roles]
        extra = {
            "email": user.email,
            "roles": roles,
            "is_superuser": user.is_superuser,
        }
        access_minutes = (
            settings.access_token_expire_minutes * 48 if remember_me else settings.access_token_expire_minutes
        )
        refresh_days = (
            settings.refresh_token_expire_days * 2 if remember_me else settings.refresh_token_expire_days
        )
        access = create_access_token(user.id, extra=extra, expires_minutes=access_minutes)
        refresh = create_refresh_token(user.id, extra={"email": user.email}, expires_days=refresh_days)
        # Store refresh jti
        try:
            payload = decode_token(refresh)
            user.refresh_token_jti = payload.get("jti")
        except JWTError:
            pass
        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
            expires_in=access_minutes * 60,
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except JWTError as exc:
            raise ValueError("Invalid refresh token") from exc
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token subject")
        user = await self.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
        if user.refresh_token_jti and user.refresh_token_jti != payload.get("jti"):
            raise ValueError("Refresh token revoked")
        return self.issue_tokens(user)

    async def request_password_reset(self, email: str) -> Optional[str]:
        user = await self.get_user_by_email(email)
        if not user:
            return None
        return create_password_reset_token(user.email)

    async def reset_password(self, token: str, new_password: str) -> User:
        email = verify_special_token(token, "password_reset")
        if not email:
            raise ValueError("Invalid or expired reset token")
        user = await self.get_user_by_email(email)
        if not user:
            raise ValueError("User not found")
        user.password_hash = hash_password(new_password)
        user.refresh_token_jti = None
        await self.db.flush()
        return user

    def create_verify_token(self, email: str) -> str:
        return create_email_verify_token(email)

    async def verify_email(self, token: str) -> User:
        email = verify_special_token(token, "email_verify")
        if not email:
            raise ValueError("Invalid or expired verification token")
        user = await self.get_user_by_email(email)
        if not user:
            raise ValueError("User not found")
        user.is_verified = True
        await self.db.flush()
        return user

    async def change_password(self, user: User, current: str, new: str) -> None:
        if not verify_password(current, user.password_hash):
            raise ValueError("Current password is incorrect")
        user.password_hash = hash_password(new)
        user.refresh_token_jti = None
        await self.db.flush()
