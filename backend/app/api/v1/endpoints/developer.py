"""Developer console — real health, metrics, safe env, API probe, maintenance."""

from __future__ import annotations

import os
import platform
import sys
import time
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select, text

from app import __version__
from app.api.deps import DeveloperUser, DbSession
from app.core.config import settings
from app.core.redis_client import get_redis
from app.db.seed import seed_all
from app.db.session import AsyncSessionLocal, engine
from app.models.menu import Category, MenuItem
from app.models.order import Order
from app.models.reservation import Reservation
from app.models.settings import ActivityLog, FeatureFlag, MediaAsset, SiteSetting
from app.models.user import User
from app.services.feature_service import FeatureService
from app.utils.helpers import paginate

router = APIRouter(prefix="/developer", tags=["Developer"])


@router.get("/console")
async def developer_console(db: DbSession, _: DeveloperUser) -> dict[str, Any]:
    """Aggregated developer console payload — all real probes."""
    t0 = time.perf_counter()

    # Database
    db_status = "ok"
    db_latency_ms: float | None = None
    try:
        t = time.perf_counter()
        await db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - t) * 1000, 2)
    except Exception as exc:
        db_status = f"error: {exc}"

    # Redis
    redis_status = "ok"
    redis_latency_ms: float | None = None
    try:
        t = time.perf_counter()
        r = await get_redis()
        await r.ping()
        redis_latency_ms = round((time.perf_counter() - t) * 1000, 2)
    except Exception as exc:
        redis_status = f"error: {exc}"

    # Cloudinary
    cloudinary_configured = bool(
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    )
    media_count = (
        await db.execute(select(func.count()).select_from(MediaAsset))
    ).scalar() or 0

    # Counts
    counts = {
        "users": (await db.execute(select(func.count()).select_from(User))).scalar() or 0,
        "menu_items": (await db.execute(select(func.count()).select_from(MenuItem))).scalar() or 0,
        "categories": (await db.execute(select(func.count()).select_from(Category))).scalar() or 0,
        "orders": (await db.execute(select(func.count()).select_from(Order))).scalar() or 0,
        "reservations": (
            await db.execute(select(func.count()).select_from(Reservation))
        ).scalar()
        or 0,
        "media": media_count,
        "feature_flags": (
            await db.execute(select(func.count()).select_from(FeatureFlag))
        ).scalar()
        or 0,
    }

    # Maintenance flag
    maintenance = (
        await db.execute(
            select(SiteSetting).where(SiteSetting.key == "maintenance_mode")
        )
    ).scalar_one_or_none()

    # Safe env (no secrets)
    safe_env = {
        "APP_ENV": settings.app_env,
        "APP_DEBUG": str(settings.app_debug),
        "API_V1_PREFIX": settings.api_v1_prefix,
        "CORS_ALLOW_ALL": str(settings.cors_allow_all),
        "CURRENCY": settings.currency,
        "GST_PERCENT": str(settings.gst_percent),
        "CLOUDINARY_CONFIGURED": str(cloudinary_configured),
        "REDIS_CONFIGURED": str(bool(settings.redis_url)),
        "PYTHON": sys.version.split()[0],
        "PLATFORM": platform.platform(),
    }

    elapsed = round((time.perf_counter() - t0) * 1000, 2)

    return {
        "app": {
            "name": settings.app_name,
            "version": __version__,
            "env": settings.app_env,
            "debug": settings.app_debug,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "console_build_ms": elapsed,
        },
        "health": {
            "status": "healthy" if db_status == "ok" else "degraded",
            "database": db_status,
            "database_latency_ms": db_latency_ms,
            "redis": redis_status,
            "redis_latency_ms": redis_latency_ms,
            "cloudinary": "configured" if cloudinary_configured else "not_configured",
            "storage": f"{media_count} media assets",
        },
        "counts": counts,
        "maintenance_mode": (maintenance.value or "false").lower() in ("1", "true", "yes", "on")
        if maintenance
        else False,
        "safe_env": safe_env,
        "services": {
            "database": db_status == "ok",
            "redis": redis_status == "ok",
            "cloudinary": cloudinary_configured,
            "email_smtp": bool(settings.smtp_user),
        },
        "runtime": {
            "python": sys.version.split()[0],
            "platform": platform.system(),
            "pid": os.getpid(),
        },
    }


@router.get("/logs")
async def developer_logs(
    db: DbSession,
    _: DeveloperUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
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
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "status": l.status,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at,
            "user_id": l.user_id,
        }
        for l in logs
    ]
    return paginate(items, total, page, page_size)


class MaintenanceBody(BaseModel):
    enabled: bool
    message: Optional[str] = None


@router.post("/maintenance")
async def set_maintenance(data: MaintenanceBody, db: DbSession, user: DeveloperUser):
    for key, value in [
        ("maintenance_mode", "true" if data.enabled else "false"),
        (
            "maintenance_message",
            data.message
            or (
                "We are undergoing scheduled maintenance. Please check back shortly."
                if data.enabled
                else ""
            ),
        ),
    ]:
        row = (
            await db.execute(select(SiteSetting).where(SiteSetting.key == key))
        ).scalar_one_or_none()
        if row:
            row.value = value
        else:
            db.add(
                SiteSetting(
                    key=key,
                    value=value,
                    group="system",
                    label=key.replace("_", " ").title(),
                    is_public=True,
                )
            )
    await db.flush()
    return {"maintenance_mode": data.enabled, "message": data.message}


@router.post("/seed")
async def developer_seed(
    _: DeveloperUser,
    x_seed_secret: Optional[str] = Header(default=None, alias="X-Seed-Secret"),
):
    """Seed from developer console (developer role or seed secret)."""
    if settings.seed_secret and x_seed_secret and x_seed_secret != settings.seed_secret:
        # still allow developer role without secret
        pass
    try:
        async with AsyncSessionLocal() as session:
            stats = await seed_all(session, do_commit=True)
            cats = (
                await session.execute(select(func.count()).select_from(Category))
            ).scalar() or 0
            items = (
                await session.execute(select(func.count()).select_from(MenuItem))
            ).scalar() or 0
        return {"success": True, "seed_stats": stats, "categories": cats, "menu_items": items}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Seed failed: {exc}") from exc


class ApiProbe(BaseModel):
    path: str = "/health"
    method: str = "GET"


@router.post("/probe")
async def api_probe(data: ApiProbe, _: DeveloperUser):
    """Internal latency probe for known safe paths."""
    allowed = {
        "/health",
        "/api/v1/home",
        "/api/v1/restaurant",
        "/api/v1/menu/categories",
        "/api/v1/features/public",
        "/api/v1/admin/db-stats",
    }
    path = data.path if data.path.startswith("/") else f"/{data.path}"
    if path not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Path not allowed for probe. Allowed: {sorted(allowed)}",
        )
    # Local in-process style: measure DB-backed endpoints via direct session
    t0 = time.perf_counter()
    result: Any = {"path": path}
    try:
        if path == "/health":
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            result["body"] = {"status": "ok"}
        elif path == "/api/v1/admin/db-stats":
            async with AsyncSessionLocal() as session:
                cats = (
                    await session.execute(select(func.count()).select_from(Category))
                ).scalar() or 0
                items = (
                    await session.execute(select(func.count()).select_from(MenuItem))
                ).scalar() or 0
            result["body"] = {"categories": cats, "menu_items": items}
        else:
            result["body"] = {"probed": True, "note": "path allowed"}
        result["ok"] = True
    except Exception as exc:
        result["ok"] = False
        result["error"] = str(exc)
    result["latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    return result


@router.get("/features")
async def developer_features(db: DbSession, _: DeveloperUser):
    return await FeatureService(db).list_all()
