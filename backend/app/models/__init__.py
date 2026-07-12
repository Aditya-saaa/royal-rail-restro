"""SQLAlchemy models — import all for Alembic metadata."""

from app.models.user import User, Role, Permission, RolePermission, UserRole
from app.models.customer import Customer, Address, WishlistItem
from app.models.menu import Category, MenuItem, Ingredient, MenuItemIngredient
from app.models.order import Order, OrderItem, Coupon
from app.models.reservation import Reservation
from app.models.content import (
    Review,
    GalleryImage,
    BlogPost,
    Event,
    Offer,
    Message,
    Notification,
    FAQ,
)
from app.models.settings import (
    SiteSetting,
    ThemeSetting,
    DeveloperSetting,
    ActivityLog,
    MediaAsset,
    FeatureFlag,
    AnalyticsEvent,
)

__all__ = [
    "User",
    "Role",
    "Permission",
    "RolePermission",
    "UserRole",
    "Customer",
    "Address",
    "WishlistItem",
    "Category",
    "MenuItem",
    "Ingredient",
    "MenuItemIngredient",
    "Order",
    "OrderItem",
    "Coupon",
    "Reservation",
    "Review",
    "GalleryImage",
    "BlogPost",
    "Event",
    "Offer",
    "Message",
    "Notification",
    "FAQ",
    "SiteSetting",
    "ThemeSetting",
    "DeveloperSetting",
    "ActivityLog",
    "MediaAsset",
    "FeatureFlag",
    "AnalyticsEvent",
]
