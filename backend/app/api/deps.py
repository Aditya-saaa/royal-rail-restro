"""FastAPI dependencies: auth, RBAC, DB session."""

from typing import Annotated, Callable, Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import AuthService

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_token_from_request(
    request: Request,
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)
    ] = None,
    access_token: Annotated[Optional[str], Cookie(alias="access_token")] = None,
) -> Optional[str]:
    if credentials and credentials.credentials:
        return credentials.credentials
    if access_token:
        return access_token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


async def get_current_user(
    db: DbSession,
    token: Annotated[Optional[str], Depends(get_token_from_request)] = None,
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject",
            )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc

    service = AuthService(db)
    user = await service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_current_user_optional(
    db: DbSession,
    token: Annotated[Optional[str], Depends(get_token_from_request)] = None,
) -> Optional[User]:
    if not token:
        return None
    try:
        return await get_current_user(db, token)
    except HTTPException:
        return None


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[Optional[User], Depends(get_current_user_optional)]


def require_roles(*roles: str) -> Callable:
    async def checker(user: CurrentUser) -> User:
        if user.is_superuser:
            return user
        user_roles = {r.name for r in user.roles}
        if not user_roles.intersection(set(roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return checker


def require_permissions(*codes: str) -> Callable:
    async def checker(user: CurrentUser) -> User:
        if user.is_superuser:
            return user
        for code in codes:
            if not user.has_permission(code):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permission: {code}",
                )
        return user

    return checker


AdminUser = Annotated[User, Depends(require_roles("admin", "manager"))]
DeveloperUser = Annotated[User, Depends(require_roles("admin", "developer"))]
StaffUser = Annotated[User, Depends(require_roles("admin", "manager", "staff"))]
