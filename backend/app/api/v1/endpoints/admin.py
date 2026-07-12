"""Admin dashboard and management endpoints."""

from typing import Any, List, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, DbSession, DeveloperUser
from app.core.config import settings
from app.db.seed import seed_all
from app.models.menu import Category, MenuItem
from app.models.settings import (
    ActivityLog,
    DeveloperSetting,
    FeatureFlag,
    MediaAsset,
    SiteSetting,
    ThemeSetting,
)
from app.models.user import Role, User
from app.schemas.auth import UserOut
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.admin_service import AdminService
from app.utils.helpers import paginate

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def dashboard(db: DbSession, _: AdminUser) -> dict[str, Any]:
    service = AdminService(db)
    return await service.dashboard_stats()


@router.get("/users", response_model=PaginatedResponse[UserOut])
async def list_users(
    db: DbSession,
    _: AdminUser,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = select(User).options(selectinload(User.roles))
    count_base = select(User)
    if search:
        term = f"%{search}%"
        q = q.where(User.email.ilike(term) | User.full_name.ilike(term))
        count_base = count_base.where(User.email.ilike(term) | User.full_name.ilike(term))
    from sqlalchemy import func

    total = (
        await db.execute(select(func.count()).select_from(count_base.subquery()))
    ).scalar() or 0
    q = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    users = (await db.execute(q)).scalars().all()
    return paginate(users, total, page, page_size)


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
async def toggle_user_active(user_id: str, db: DbSession, _: AdminUser):
    result = await db.execute(
        select(User).options(selectinload(User.roles)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/settings/site")
async def get_site_settings(db: DbSession, _: AdminUser):
    result = await db.execute(select(SiteSetting).order_by(SiteSetting.group, SiteSetting.key))
    rows = result.scalars().all()
    return [{"id": r.id, "key": r.key, "value": r.value, "group": r.group, "label": r.label} for r in rows]


@router.put("/settings/site/{key}")
async def upsert_site_setting(key: str, value: str, db: DbSession, _: AdminUser):
    result = await db.execute(select(SiteSetting).where(SiteSetting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        setting = SiteSetting(key=key, value=value)
        db.add(setting)
    await db.flush()
    return {"key": key, "value": value}


@router.get("/settings/theme")
async def get_theme(db: DbSession):
    """Public-ish theme settings for frontend."""
    result = await db.execute(select(ThemeSetting))
    rows = result.scalars().all()
    return {r.key: r.value for r in rows}


@router.put("/settings/theme/{key}")
async def upsert_theme(key: str, value: str, db: DbSession, _: DeveloperUser):
    result = await db.execute(select(ThemeSetting).where(ThemeSetting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        setting = ThemeSetting(key=key, value=value)
        db.add(setting)
    await db.flush()
    return {"key": key, "value": value}


@router.get("/feature-flags")
async def list_flags(db: DbSession, _: DeveloperUser):
    result = await db.execute(select(FeatureFlag).order_by(FeatureFlag.key))
    return [
        {
            "id": f.id,
            "key": f.key,
            "enabled": f.enabled,
            "description": f.description,
            "rollout_percent": f.rollout_percent,
        }
        for f in result.scalars().all()
    ]


@router.patch("/feature-flags/{key}")
async def toggle_flag(key: str, enabled: bool, db: DbSession, _: DeveloperUser):
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    flag.enabled = enabled
    await db.flush()
    return {"key": key, "enabled": enabled}


@router.get("/activity-logs")
async def activity_logs(
    db: DbSession,
    _: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    from sqlalchemy import func

    total = (await db.execute(select(func.count()).select_from(ActivityLog))).scalar() or 0
    result = await db.execute(
        select(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    logs = result.scalars().all()
    items = [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "ip_address": l.ip_address,
            "status": l.status,
            "details": l.details,
            "created_at": l.created_at,
        }
        for l in logs
    ]
    return paginate(items, total, page, page_size)


@router.get("/media")
async def list_media(db: DbSession, _: AdminUser, page: int = 1, page_size: int = 24):
    from sqlalchemy import func

    total = (await db.execute(select(func.count()).select_from(MediaAsset))).scalar() or 0
    result = await db.execute(
        select(MediaAsset)
        .order_by(MediaAsset.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    assets = result.scalars().all()
    items = [
        {
            "id": a.id,
            "filename": a.filename,
            "url": a.url,
            "format": a.format,
            "width": a.width,
            "height": a.height,
            "bytes": a.bytes,
            "folder": a.folder,
            "alt_text": a.alt_text,
        }
        for a in assets
    ]
    return paginate(items, total, page, page_size)


@router.get("/developer/settings")
async def developer_settings(db: DbSession, _: DeveloperUser):
    result = await db.execute(select(DeveloperSetting))
    rows = result.scalars().all()
    return [
        {
            "key": r.key,
            "value": "***" if r.is_secret else r.value,
            "is_secret": r.is_secret,
            "description": r.description,
        }
        for r in rows
    ]


@router.get("/health/detailed")
async def detailed_health(db: DbSession, _: DeveloperUser):
    from datetime import datetime, timezone

    from app.core.redis_client import get_redis

    db_status = "ok"
    try:
        await db.execute(select(1))
    except Exception as exc:
        db_status = f"error: {exc}"

    redis_status = "ok"
    try:
        r = await get_redis()
        await r.ping()
    except Exception as exc:
        redis_status = f"error: {exc}"

    cloudinary_status = (
        "configured" if settings.cloudinary_cloud_name else "not_configured"
    )

    cats = (await db.execute(select(func.count()).select_from(Category))).scalar() or 0
    items = (await db.execute(select(func.count()).select_from(MenuItem))).scalar() or 0

    return {
        "status": "healthy" if db_status == "ok" else "degraded",
        "app": settings.app_name,
        "version": "1.0.0",
        "database": db_status,
        "redis": redis_status,
        "cloudinary": cloudinary_status,
        "timestamp": datetime.now(timezone.utc),
        "env": settings.app_env,
        "categories": cats,
        "menu_items": items,
    }


@router.post("/seed")
async def run_seed(
    x_seed_secret: Optional[str] = Header(default=None, alias="X-Seed-Secret"),
    authorization: Optional[str] = Header(default=None),
):
    """
    Seed / re-seed catalogue, roles, admin, content.

    Uses a dedicated AsyncSession (not request-scoped get_db) so commit/rollback
    is independent and avoids MissingGreenlet / double-transaction issues.

    Auth options:
    1. Header X-Seed-Secret matching SEED_SECRET env (for first deploy)
    2. Bearer token of an admin/superuser
    """
    from app.db.session import AsyncSessionLocal

    allowed = False
    if settings.seed_secret and x_seed_secret and x_seed_secret == settings.seed_secret:
        allowed = True
    elif authorization and authorization.lower().startswith("bearer "):
        from jose import JWTError
        from app.core.security import decode_token
        from app.services.auth_service import AuthService

        token = authorization.split(" ", 1)[1]
        try:
            async with AsyncSessionLocal() as auth_db:
                payload = decode_token(token)
                user = await AuthService(auth_db).get_user_by_id(payload.get("sub", ""))
                if user and (user.is_superuser or user.has_role("admin")):
                    allowed = True
        except JWTError:
            allowed = False

    # Dev convenience when seed_secret unset and debug on
    if not allowed and settings.app_debug and not settings.is_production:
        allowed = True

    if not allowed:
        raise HTTPException(
            status_code=403,
            detail="Provide X-Seed-Secret header or admin Bearer token",
        )

    try:
        async with AsyncSessionLocal() as session:
            seed_stats = await seed_all(session, do_commit=True)
            cats = (
                await session.execute(select(func.count()).select_from(Category))
            ).scalar() or 0
            items = (
                await session.execute(select(func.count()).select_from(MenuItem))
            ).scalar() or 0
            users = (
                await session.execute(select(func.count()).select_from(User))
            ).scalar() or 0
    except Exception as exc:
        # Full message helps Render logs / API clients without needing stack traces
        raise HTTPException(
            status_code=500,
            detail=f"Seed failed: {type(exc).__name__}: {exc}",
        ) from exc

    return {
        "message": "Seed completed",
        "success": True,
        "categories": cats,
        "menu_items": items,
        "users": users,
        "seed_stats": seed_stats,
    }


@router.get("/db-stats")
async def db_stats(db: DbSession):
    """Public lightweight stats to diagnose empty catalogue (no secrets)."""
    cats = (await db.execute(select(func.count()).select_from(Category))).scalar() or 0
    items = (await db.execute(select(func.count()).select_from(MenuItem))).scalar() or 0
    users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    return {
        "categories": cats,
        "menu_items": items,
        "users": users,
        "seeded": cats > 0 and items > 0,
    }
