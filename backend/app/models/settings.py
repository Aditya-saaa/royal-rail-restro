"""Site, theme, developer settings, media, logs, feature flags."""

from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SiteSetting(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_type: Mapped[str] = mapped_column(String(20), default="string")
    group: Mapped[str] = mapped_column(String(50), default="general")
    label: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)


class ThemeSetting(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "theme_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="colors")  # colors | typography | layout | custom


class DeveloperSetting(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "developer_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class ActivityLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "activity_logs"

    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="success")


class MediaAsset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "media_assets"

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    secure_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    public_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    resource_type: Mapped[str] = mapped_column(String(30), default="image")
    format: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    folder: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    alt_text: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    uploaded_by: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class FeatureFlag(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "feature_flags"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rollout_percent: Mapped[int] = mapped_column(Integer, default=100)


class AnalyticsEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "analytics_events"

    event_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    properties: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    referrer: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    device: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
