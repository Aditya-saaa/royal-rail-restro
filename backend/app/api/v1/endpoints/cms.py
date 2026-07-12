"""Restaurant CMS — site settings, theme, bulk content ops (admin)."""

from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession
from app.models.settings import SiteSetting, ThemeSetting
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/cms", tags=["CMS"])


class SettingItem(BaseModel):
    key: str
    value: Optional[str] = None
    group: str = "general"
    label: Optional[str] = None
    is_public: bool = True


class ThemeBulk(BaseModel):
    values: dict[str, str] = Field(default_factory=dict)


class RestaurantProfile(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_image: Optional[str] = None
    hero_video: Optional[str] = None
    about: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    whatsapp: Optional[str] = None
    opening_hours_json: Optional[str] = None
    holidays_json: Optional[str] = None
    footer_text: Optional[str] = None


PROFILE_KEYS = [
    "restaurant_name",
    "restaurant_tagline",
    "restaurant_phone",
    "restaurant_email",
    "restaurant_address",
    "logo_url",
    "hero_title",
    "hero_subtitle",
    "hero_image",
    "hero_video",
    "about_html",
    "social_facebook",
    "social_instagram",
    "social_whatsapp",
    "opening_hours_json",
    "holidays_json",
    "footer_text",
]


async def _upsert(db, key: str, value: str, group: str = "cms", label: str | None = None):
    result = await db.execute(select(SiteSetting).where(SiteSetting.key == key))
    row = result.scalar_one_or_none()
    if row:
        row.value = value
    else:
        db.add(
            SiteSetting(
                key=key,
                value=value,
                group=group,
                label=label or key.replace("_", " ").title(),
                is_public=True,
            )
        )
    await db.flush()


@router.get("/public")
async def public_cms(db: DbSession) -> dict[str, Any]:
    result = await db.execute(
        select(SiteSetting).where(SiteSetting.is_public.is_(True))
    )
    rows = result.scalars().all()
    data = {r.key: r.value for r in rows}
    theme = (await db.execute(select(ThemeSetting))).scalars().all()
    return {
        "settings": data,
        "theme": {t.key: t.value for t in theme},
    }


@router.get("/profile")
async def get_profile(db: DbSession, _: AdminUser) -> dict[str, Any]:
    result = await db.execute(select(SiteSetting))
    rows = result.scalars().all()
    return {r.key: r.value for r in rows}


@router.put("/profile")
async def update_profile(data: RestaurantProfile, db: DbSession, _: AdminUser):
    mapping = {
        "name": "restaurant_name",
        "tagline": "restaurant_tagline",
        "phone": "restaurant_phone",
        "email": "restaurant_email",
        "address": "restaurant_address",
        "logo_url": "logo_url",
        "hero_title": "hero_title",
        "hero_subtitle": "hero_subtitle",
        "hero_image": "hero_image",
        "hero_video": "hero_video",
        "about": "about_html",
        "facebook": "social_facebook",
        "instagram": "social_instagram",
        "whatsapp": "social_whatsapp",
        "opening_hours_json": "opening_hours_json",
        "holidays_json": "holidays_json",
        "footer_text": "footer_text",
    }
    payload = data.model_dump(exclude_unset=True)
    for field, key in mapping.items():
        if field in payload and payload[field] is not None:
            await _upsert(db, key, str(payload[field]), group="cms")
    return MessageResponse(message="Profile updated")


@router.put("/theme")
async def update_theme_bulk(data: ThemeBulk, db: DbSession, _: AdminUser):
    for key, value in data.values.items():
        result = await db.execute(select(ThemeSetting).where(ThemeSetting.key == key))
        row = result.scalar_one_or_none()
        if row:
            row.value = value
        else:
            db.add(ThemeSetting(key=key, value=value, category="colors"))
    await db.flush()
    return MessageResponse(message="Theme updated")


@router.get("/theme")
async def get_theme_cms(db: DbSession):
    rows = (await db.execute(select(ThemeSetting))).scalars().all()
    return {r.key: r.value for r in rows}


class HomepageSection(BaseModel):
    id: str
    label: str
    enabled: bool = True
    order: int = 0


class HomepageLayout(BaseModel):
    sections: List[HomepageSection]


DEFAULT_HOME_SECTIONS = [
    {"id": "hero", "label": "Hero", "enabled": True, "order": 0},
    {"id": "stats", "label": "Statistics", "enabled": True, "order": 1},
    {"id": "categories", "label": "Categories", "enabled": True, "order": 2},
    {"id": "featured", "label": "Featured Dishes", "enabled": True, "order": 3},
    {"id": "awards", "label": "Why Choose Us", "enabled": True, "order": 4},
    {"id": "offers", "label": "Offers", "enabled": True, "order": 5},
    {"id": "chef", "label": "Chef Specials", "enabled": True, "order": 6},
    {"id": "rail", "label": "Rail Specials", "enabled": True, "order": 7},
    {"id": "story", "label": "Our Story", "enabled": True, "order": 8},
    {"id": "testimonials", "label": "Testimonials", "enabled": True, "order": 9},
    {"id": "gallery", "label": "Gallery", "enabled": True, "order": 10},
    {"id": "reservation_cta", "label": "Reservation CTA", "enabled": True, "order": 11},
    {"id": "map", "label": "Map", "enabled": True, "order": 12},
]


@router.get("/homepage-layout")
async def get_homepage_layout(db: DbSession):
    result = await db.execute(
        select(SiteSetting).where(SiteSetting.key == "homepage_layout_json")
    )
    row = result.scalar_one_or_none()
    if row and row.value:
        try:
            import json

            return {"sections": json.loads(row.value)}
        except Exception:
            pass
    return {"sections": DEFAULT_HOME_SECTIONS}


@router.put("/homepage-layout")
async def put_homepage_layout(data: HomepageLayout, db: DbSession, _: AdminUser):
    import json

    payload = json.dumps([s.model_dump() for s in data.sections])
    await _upsert(db, "homepage_layout_json", payload, group="homepage", label="Homepage Layout")
    return MessageResponse(message="Homepage layout saved")
