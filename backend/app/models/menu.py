"""Menu categories, items, ingredients."""

from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Category(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    meta_title: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)

    items: Mapped[List["MenuItem"]] = relationship(
        "MenuItem",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class MenuItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "menu_items"

    category_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("categories.id", ondelete="RESTRICT"), index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    compare_at_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    gallery_urls: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array string
    is_veg: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    spice_level: Mapped[int] = mapped_column(Integer, default=0)  # 0-5
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_chef_special: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_seasonal: Mapped[bool] = mapped_column(Boolean, default=False)
    is_rail_special: Mapped[bool] = mapped_column(Boolean, default=False)
    preparation_time_mins: Mapped[int] = mapped_column(Integer, default=20)
    calories: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    protein_g: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    carbs_g: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    fat_g: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    allergens: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    recommended_pairing: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    stock_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("0.00"))
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    meta_title: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)

    category: Mapped["Category"] = relationship(
        "Category", back_populates="items", lazy="selectin"
    )
    ingredients: Mapped[List["Ingredient"]] = relationship(
        "Ingredient",
        secondary="menu_item_ingredients",
        back_populates="menu_items",
        lazy="selectin",
    )


class Ingredient(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ingredients"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_allergen: Mapped[bool] = mapped_column(Boolean, default=False)
    unit: Mapped[str] = mapped_column(String(20), default="g")

    menu_items: Mapped[List["MenuItem"]] = relationship(
        "MenuItem", secondary="menu_item_ingredients", back_populates="ingredients"
    )


class MenuItemIngredient(Base):
    __tablename__ = "menu_item_ingredients"
    __table_args__ = (
        UniqueConstraint("menu_item_id", "ingredient_id", name="uq_menu_ingredient"),
    )

    menu_item_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("menu_items.id", ondelete="CASCADE"), primary_key=True
    )
    ingredient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True
    )
    quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
