"""Orders, order items, coupons."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.menu import MenuItem


class Coupon(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    discount_type: Mapped[str] = mapped_column(String(20), default="percent")  # percent | fixed
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    min_order_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    max_discount: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    usage_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    per_user_limit: Mapped[int] = mapped_column(Integer, default=1)
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    applicable_to: Mapped[str] = mapped_column(String(30), default="all")  # all | delivery | pickup


class Order(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    guest_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    guest_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    guest_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    order_type: Mapped[str] = mapped_column(String(20), default="delivery")  # delivery | pickup | dine_in
    status: Mapped[str] = mapped_column(
        String(30), default="pending", index=True
    )  # pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled
    payment_status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    payment_method: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    gst_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    packing_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    coupon_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True
    )
    coupon_code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)

    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_ready_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tracking_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    invoice_number: Mapped[Optional[str]] = mapped_column(String(40), unique=True, nullable=True)

    user: Mapped[Optional["User"]] = relationship("User")
    coupon: Mapped[Optional["Coupon"]] = relationship("Coupon")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    menu_item_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("menu_items.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_veg: Mapped[bool] = mapped_column(Boolean, default=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    special_notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    menu_item: Mapped[Optional["MenuItem"]] = relationship("MenuItem")
