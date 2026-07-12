"""Feature flag / module toggle service with cache-friendly public map."""

from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settings import FeatureFlag

# Catalog of owner-facing toggles (seeded if missing)
FEATURE_CATALOG: list[dict[str, Any]] = [
    # Customer
    {"key": "online_ordering", "category": "customer", "description": "Online ordering (cart & checkout)", "enabled": True, "visible": True},
    {"key": "table_reservation", "category": "customer", "description": "Table reservations", "enabled": True, "visible": True},
    {"key": "delivery", "category": "customer", "description": "Delivery order type", "enabled": True, "visible": True},
    {"key": "pickup", "category": "customer", "description": "Pickup order type", "enabled": True, "visible": True},
    {"key": "dine_in_ordering", "category": "customer", "description": "Dine-in ordering", "enabled": True, "visible": True},
    {"key": "loyalty_program", "category": "customer", "description": "Loyalty points", "enabled": True, "visible": True},
    {"key": "referral_program", "category": "customer", "description": "Referral program", "enabled": False, "visible": False},
    {"key": "coupons", "category": "customer", "description": "Coupon codes at checkout", "enabled": True, "visible": True},
    {"key": "wishlist", "category": "customer", "description": "Wishlist / favorites", "enabled": False, "visible": False},
    {"key": "user_accounts", "category": "customer", "description": "Customer accounts", "enabled": True, "visible": True},
    {"key": "reviews", "category": "customer", "description": "Customer reviews", "enabled": True, "visible": True},
    {"key": "ratings", "category": "customer", "description": "Dish ratings", "enabled": True, "visible": True},
    {"key": "search", "category": "customer", "description": "Site search", "enabled": True, "visible": True},
    {"key": "blog", "category": "customer", "description": "Blog", "enabled": True, "visible": True},
    {"key": "events", "category": "customer", "description": "Events", "enabled": True, "visible": True},
    {"key": "gallery", "category": "customer", "description": "Gallery", "enabled": True, "visible": True},
    {"key": "contact_form", "category": "customer", "description": "Contact form", "enabled": True, "visible": True},
    {"key": "whatsapp_chat", "category": "customer", "description": "WhatsApp chat button", "enabled": True, "visible": True},
    {"key": "live_chat", "category": "customer", "description": "Live chat widget", "enabled": False, "visible": False},
    {"key": "notifications", "category": "customer", "description": "In-app notifications", "enabled": True, "visible": True},
    {"key": "dark_mode", "category": "customer", "description": "Dark mode toggle", "enabled": True, "visible": True},
    {"key": "pwa", "category": "customer", "description": "PWA install prompt", "enabled": True, "visible": True},
    # Homepage sections
    {"key": "home_hero", "category": "homepage", "description": "Hero section", "enabled": True, "visible": True},
    {"key": "home_featured_dishes", "category": "homepage", "description": "Featured dishes", "enabled": True, "visible": True},
    {"key": "home_categories", "category": "homepage", "description": "Categories grid", "enabled": True, "visible": True},
    {"key": "home_chef_specials", "category": "homepage", "description": "Chef specials", "enabled": True, "visible": True},
    {"key": "home_rail_specials", "category": "homepage", "description": "Rail specials", "enabled": True, "visible": True},
    {"key": "home_testimonials", "category": "homepage", "description": "Testimonials", "enabled": True, "visible": True},
    {"key": "home_instagram", "category": "homepage", "description": "Instagram feed", "enabled": False, "visible": False},
    {"key": "home_events", "category": "homepage", "description": "Events strip", "enabled": True, "visible": True},
    {"key": "home_offers", "category": "homepage", "description": "Offers section", "enabled": True, "visible": True},
    {"key": "home_gallery", "category": "homepage", "description": "Gallery strip", "enabled": True, "visible": True},
    {"key": "home_story", "category": "homepage", "description": "Restaurant story", "enabled": True, "visible": True},
    {"key": "home_awards", "category": "homepage", "description": "Awards / why choose us", "enabled": True, "visible": True},
    {"key": "home_google_reviews", "category": "homepage", "description": "Google reviews embed", "enabled": False, "visible": False},
    {"key": "home_newsletter", "category": "homepage", "description": "Newsletter signup", "enabled": False, "visible": False},
    {"key": "home_reservation_cta", "category": "homepage", "description": "Reservation CTA", "enabled": True, "visible": True},
    # Admin modules
    {"key": "admin_orders", "category": "admin", "description": "Orders module", "enabled": True, "visible": True},
    {"key": "admin_reservations", "category": "admin", "description": "Reservations module", "enabled": True, "visible": True},
    {"key": "admin_blogs", "category": "admin", "description": "Blogs module", "enabled": True, "visible": True},
    {"key": "admin_events", "category": "admin", "description": "Events module", "enabled": True, "visible": True},
    {"key": "admin_gallery", "category": "admin", "description": "Gallery module", "enabled": True, "visible": True},
    {"key": "admin_users", "category": "admin", "description": "Users module", "enabled": True, "visible": True},
    {"key": "admin_analytics", "category": "admin", "description": "Analytics module", "enabled": True, "visible": True},
    {"key": "admin_settings", "category": "admin", "description": "Settings module", "enabled": True, "visible": True},
    {"key": "admin_theme", "category": "admin", "description": "Theme editor", "enabled": True, "visible": True},
    {"key": "admin_media", "category": "admin", "description": "Media library", "enabled": True, "visible": True},
    {"key": "admin_features", "category": "admin", "description": "Feature manager", "enabled": True, "visible": True},
    {"key": "developer_panel", "category": "admin", "description": "Developer panel", "enabled": True, "visible": True},
]


class FeatureService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_catalog(self) -> int:
        """Insert missing catalog flags (idempotent)."""
        created = 0
        existing = set(
            (await self.db.execute(select(FeatureFlag.key))).scalars().all()
        )
        for item in FEATURE_CATALOG:
            if item["key"] in existing:
                continue
            # Store visible + maintenance in description JSON-ish suffix for schema compat
            # Schema only has key, enabled, description, rollout_percent
            desc = item["description"]
            if not item.get("visible", True):
                desc = f"{desc} |visible=0"
            if item.get("maintenance_message"):
                desc = f"{desc} |msg={item['maintenance_message']}"
            self.db.add(
                FeatureFlag(
                    key=item["key"],
                    enabled=bool(item.get("enabled", True)),
                    description=desc,
                    rollout_percent=100 if item.get("visible", True) else 0,
                )
            )
            created += 1
        if created:
            await self.db.flush()
        return created

    @staticmethod
    def _parse_meta(flag: FeatureFlag) -> dict[str, Any]:
        desc = flag.description or ""
        visible = True
        maintenance = None
        clean = desc
        if "|visible=0" in desc:
            visible = False
            clean = clean.replace("|visible=0", "").strip()
        if "|msg=" in desc:
            parts = desc.split("|msg=", 1)
            clean = parts[0].replace("|visible=0", "").strip()
            maintenance = parts[1].strip() or None
        # rollout_percent 0 also means hidden in UI
        if (flag.rollout_percent or 100) <= 0:
            visible = False
        category = "general"
        for item in FEATURE_CATALOG:
            if item["key"] == flag.key:
                category = item["category"]
                if not clean:
                    clean = item["description"]
                break
        return {
            "id": flag.id,
            "key": flag.key,
            "enabled": bool(flag.enabled),
            "visible": visible,
            "description": clean,
            "category": category,
            "maintenance_message": maintenance,
            "rollout_percent": flag.rollout_percent or 100,
        }

    async def list_all(self) -> list[dict[str, Any]]:
        await self.ensure_catalog()
        rows = (
            await self.db.execute(select(FeatureFlag).order_by(FeatureFlag.key))
        ).scalars().all()
        return [self._parse_meta(f) for f in rows]

    async def public_map(self) -> dict[str, Any]:
        """Frontend-friendly map: key -> {enabled, visible, message}."""
        items = await self.list_all()
        return {
            i["key"]: {
                "enabled": i["enabled"],
                "visible": i["visible"],
                "message": i["maintenance_message"]
                or (
                    "This service is temporarily unavailable."
                    if not i["enabled"]
                    else None
                ),
            }
            for i in items
        }

    async def update(
        self,
        key: str,
        *,
        enabled: Optional[bool] = None,
        visible: Optional[bool] = None,
        maintenance_message: Optional[str] = None,
        description: Optional[str] = None,
    ) -> dict[str, Any]:
        await self.ensure_catalog()
        flag = (
            await self.db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
        ).scalar_one_or_none()
        if not flag:
            raise ValueError(f"Unknown feature: {key}")
        meta = self._parse_meta(flag)
        if enabled is not None:
            flag.enabled = enabled
        vis = meta["visible"] if visible is None else visible
        msg = meta["maintenance_message"] if maintenance_message is None else maintenance_message
        base_desc = description if description is not None else meta["description"]
        parts = [base_desc]
        if not vis:
            parts.append("|visible=0")
        if msg:
            parts.append(f"|msg={msg}")
        flag.description = " ".join(parts).strip()
        flag.rollout_percent = 100 if vis else 0
        await self.db.flush()
        return self._parse_meta(flag)

    async def is_enabled(self, key: str) -> bool:
        flag = (
            await self.db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
        ).scalar_one_or_none()
        if not flag:
            return True
        return bool(flag.enabled)
