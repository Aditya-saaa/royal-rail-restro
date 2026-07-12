"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.schemas.auth import (
    ChangePasswordRequest,
    EmailVerifyRequest,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
    UserUpdate,
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.utils.helpers import apply_updates

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_auth_cookies(response: Response, tokens: TokenResponse) -> None:
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=settings.cookie_secure or settings.is_production,
        samesite=settings.cookie_samesite,
        max_age=tokens.expires_in,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=settings.cookie_secure or settings.is_production,
        samesite=settings.cookie_samesite,
        max_age=settings.refresh_token_expire_days * 86400,
        path="/",
    )


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: DbSession):
    service = AuthService(db)
    try:
        user = await service.signup(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response, db: DbSession):
    service = AuthService(db)
    try:
        user = await service.authenticate(data.email, data.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    tokens = service.issue_tokens(user, remember_me=data.remember_me)
    await db.flush()
    _set_auth_cookies(response, tokens)
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, response: Response, db: DbSession):
    service = AuthService(db)
    try:
        tokens = await service.refresh_tokens(data.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    await db.flush()
    _set_auth_cookies(response, tokens)
    return tokens


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, user: CurrentUser, db: DbSession):
    user.refresh_token_jti = None
    await db.flush()
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(data: UserUpdate, user: CurrentUser, db: DbSession):
    apply_updates(user, data.model_dump(exclude_unset=True))
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest, user: CurrentUser, db: DbSession
):
    service = AuthService(db)
    try:
        await service.change_password(user, data.current_password, data.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Password changed successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: PasswordResetRequest, db: DbSession):
    service = AuthService(db)
    token = await service.request_password_reset(data.email)
    # In production, send email. For now, return success always (anti-enumeration).
    # Token available in debug logs if needed.
    _ = token
    return MessageResponse(
        message="If an account exists with that email, a reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: PasswordResetConfirm, db: DbSession):
    service = AuthService(db)
    try:
        await service.reset_password(data.token, data.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Password reset successfully")


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(data: EmailVerifyRequest, db: DbSession):
    service = AuthService(db)
    try:
        await service.verify_email(data.token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Email verified successfully")


@router.post("/send-verification", response_model=MessageResponse)
async def send_verification(user: CurrentUser, db: DbSession):
    if user.is_verified:
        return MessageResponse(message="Email already verified")
    service = AuthService(db)
    _ = service.create_verify_token(user.email)
    return MessageResponse(message="Verification email sent")
