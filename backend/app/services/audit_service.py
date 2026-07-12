"""Activity / audit logging helper."""

from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settings import ActivityLog


async def log_activity(
    db: AsyncSession,
    *,
    action: str,
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[str | dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    status: str = "success",
) -> None:
    detail_str = details if isinstance(details, str) else (
        None if details is None else str(details)
    )
    db.add(
        ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=detail_str,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
        )
    )
    await db.flush()
