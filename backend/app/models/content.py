"""Reviews, gallery, blogs, events, offers, messages, FAQs."""

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.menu import MenuItem
    from app.models.order import Order


class Review(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reviews"

    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    menu_item_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("menu_items.id", ondelete="SET NULL"), nullable=True
    )
    order_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True
    )
    guest_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    admin_reply: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[Optional["User"]] = relationship("User")
    menu_item: Mapped[Optional["MenuItem"]] = relationship("MenuItem")


class GalleryImage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "gallery_images"

    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="general", index=True)
    alt_text: Mapped[str] = mapped_column(String(200), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class BlogPost(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "blog_posts"

    author_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False, index=True)
    excerpt: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    views: Mapped[int] = mapped_column(Integer, default=0)
    meta_title: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)

    author: Mapped[Optional["User"]] = relationship("User")


class Event(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    end_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    location: Mapped[str] = mapped_column(String(255), default="Royal Rail Restro, Gaya")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    max_attendees: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    registration_required: Mapped[bool] = mapped_column(Boolean, default=False)


class Offer(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "offers"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    discount_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    coupon_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Message(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "messages"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="new", index=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(40), default="info")
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    channel: Mapped[str] = mapped_column(String(30), default="in_app")  # in_app | email | sms | push


class FAQ(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "faqs"

    question: Mapped[str] = mapped_column(String(500), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="general", index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
