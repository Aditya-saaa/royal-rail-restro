"""Public + admin feature flags."""

from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import AdminUser, DbSession
from app.services.feature_service import FeatureService

router = APIRouter(prefix="/features", tags=["Features"])


class FeatureUpdate(BaseModel):
    enabled: Optional[bool] = None
    visible: Optional[bool] = None
    maintenance_message: Optional[str] = None
    description: Optional[str] = None


class FeatureBulkUpdate(BaseModel):
    updates: List[dict[str, Any]] = Field(default_factory=list)
    # each: { key, enabled?, visible?, maintenance_message? }


@router.get("/public")
async def public_features(db: DbSession) -> dict[str, Any]:
    service = FeatureService(db)
    return await service.public_map()


@router.get("")
async def list_features(db: DbSession, _: AdminUser) -> list[dict[str, Any]]:
    service = FeatureService(db)
    return await service.list_all()


@router.patch("/{key}")
async def update_feature(key: str, data: FeatureUpdate, db: DbSession, _: AdminUser):
    service = FeatureService(db)
    try:
        return await service.update(
            key,
            enabled=data.enabled,
            visible=data.visible,
            maintenance_message=data.maintenance_message,
            description=data.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/bulk")
async def bulk_update(data: FeatureBulkUpdate, db: DbSession, _: AdminUser):
    service = FeatureService(db)
    results = []
    for item in data.updates:
        key = item.get("key")
        if not key:
            continue
        try:
            results.append(
                await service.update(
                    key,
                    enabled=item.get("enabled"),
                    visible=item.get("visible"),
                    maintenance_message=item.get("maintenance_message"),
                )
            )
        except ValueError:
            continue
    return {"updated": len(results), "items": results}


@router.post("/ensure-catalog")
async def ensure_catalog(db: DbSession, _: AdminUser):
    service = FeatureService(db)
    created = await service.ensure_catalog()
    return {"created": created, "items": await service.list_all()}
