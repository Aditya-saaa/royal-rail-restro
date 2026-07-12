"""Table reservations."""

from datetime import date, datetime, time
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class Reservation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reservations"

    reservation_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    guest_name: Mapped[str] = mapped_column(String(150), nullable=False)
    guest_email: Mapped[str] = mapped_column(String(255), nullable=False)
    guest_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    reservation_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    reservation_time: Mapped[time] = mapped_column(Time, nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    special_requests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    occasion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default="pending", index=True
    )  # pending, confirmed, seated, completed, cancelled, no_show
    table_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reminder_sent: Mapped[bool] = mapped_column(default=False)

    user: Mapped[Optional["User"]] = relationship("User")
