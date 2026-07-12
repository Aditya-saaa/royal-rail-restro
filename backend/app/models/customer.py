"""Customer profile, addresses, wishlist."""

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.menu import MenuItem


class Customer(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "customers"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    loyalty_points: Mapped[int] = mapped_column(default=0)
    referral_code: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    referred_by: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    anniversary: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    preferred_cuisine: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="customer")
    addresses: Mapped[List["Address"]] = relationship(
        "Address", back_populates="customer", cascade="all, delete-orphan"
    )
    wishlist: Mapped[List["WishlistItem"]] = relationship(
        "WishlistItem", back_populates="customer", cascade="all, delete-orphan"
    )


class Address(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "addresses"

    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    label: Mapped[str] = mapped_column(String(50), default="Home")
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    line1: Mapped[str] = mapped_column(String(255), nullable=False)
    line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), default="Gaya")
    state: Mapped[str] = mapped_column(String(100), default="Bihar")
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    landmark: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    latitude: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    longitude: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="addresses")


class WishlistItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "wishlist_items"

    customer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    menu_item_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("menu_items.id", ondelete="CASCADE"), index=True
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="wishlist")
    menu_item: Mapped["MenuItem"] = relationship("MenuItem")
