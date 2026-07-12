"""Public restaurant info, search, sitemap helpers."""

from typing import Any, List, Optional

from fastapi import APIRouter, Query
from sqlalchemy import or_, select

from app.api.deps import DbSession
from app.core.config import settings
from app.models.menu import Category, MenuItem
from app.models.content import BlogPost, FAQ

router = APIRouter(tags=["Public"])


@router.get("/restaurant")
async def restaurant_info() -> dict[str, Any]:
    return {
        "name": settings.restaurant_name,
        "phone": settings.restaurant_phone,
        "email": settings.restaurant_email,
        "address": settings.restaurant_address,
        "latitude": settings.restaurant_lat,
        "longitude": settings.restaurant_lng,
        "currency": settings.currency,
        "gst_percent": settings.gst_percent,
        "cuisines": [
            "North Indian",
            "Chinese",
            "Tandoor",
            "Fast Food",
            "Pizza",
            "Burgers",
            "Momos",
            "Soups",
            "Rice & Biryani",
            "Beverages",
            "Desserts",
        ],
        "hours": {
            "monday": "11:00 AM – 10:30 PM",
            "tuesday": "11:00 AM – 10:30 PM",
            "wednesday": "11:00 AM – 10:30 PM",
            "thursday": "11:00 AM – 10:30 PM",
            "friday": "11:00 AM – 11:00 PM",
            "saturday": "11:00 AM – 11:00 PM",
            "sunday": "11:00 AM – 10:30 PM",
        },
        "features": [
            "Family Restaurant",
            "Table Reservation",
            "Online Ordering",
            "Takeaway",
            "Pure Veg Options",
            "Parking Available",
        ],
    }


@router.get("/search")
async def global_search(
    db: DbSession,
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(10, ge=1, le=30),
    is_veg: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    suggest: bool = False,
):
    """Search with optional filters. suggest=true returns lightweight typeahead."""
    raw = q.strip()
    term = f"%{raw}%"
    # Simple typo tolerance: also search without last char / middle space collapse
    alt = f"%{raw[:-1]}%" if len(raw) > 3 else None

    conds = [
        MenuItem.is_available.is_(True),
        or_(
            MenuItem.name.ilike(term),
            MenuItem.description.ilike(term),
            MenuItem.tags.ilike(term),
            MenuItem.short_description.ilike(term),
            *( [MenuItem.name.ilike(alt)] if alt else [] ),
        ),
    ]
    if is_veg is not None:
        conds.append(MenuItem.is_veg.is_(is_veg))
    if min_price is not None:
        conds.append(MenuItem.price >= min_price)
    if max_price is not None:
        conds.append(MenuItem.price <= max_price)

    items = (
        await db.execute(select(MenuItem).where(*conds).order_by(MenuItem.name).limit(limit))
    ).scalars().all()

    if suggest:
        return {
            "query": q,
            "suggestions": [
                {
                    "type": "menu",
                    "id": i.id,
                    "label": i.name,
                    "slug": i.slug,
                    "price": float(i.price),
                    "is_veg": i.is_veg,
                }
                for i in items[:8]
            ],
        }

    categories = (
        await db.execute(
            select(Category)
            .where(Category.is_active.is_(True), Category.name.ilike(term))
            .limit(5)
        )
    ).scalars().all()

    posts = (
        await db.execute(
            select(BlogPost)
            .where(BlogPost.status == "published", BlogPost.title.ilike(term))
            .limit(5)
        )
    ).scalars().all()

    popular = (
        await db.execute(
            select(MenuItem)
            .where(MenuItem.is_featured.is_(True), MenuItem.is_available.is_(True))
            .limit(5)
        )
    ).scalars().all()

    return {
        "query": q,
        "menu_items": [
            {
                "id": i.id,
                "name": i.name,
                "slug": i.slug,
                "price": float(i.price),
                "image_url": i.image_url,
                "is_veg": i.is_veg,
                "rating_avg": float(i.rating_avg or 0),
            }
            for i in items
        ],
        "categories": [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories],
        "blog_posts": [
            {"id": p.id, "title": p.title, "slug": p.slug, "excerpt": p.excerpt}
            for p in posts
        ],
        "popular": [
            {"id": i.id, "name": i.name, "slug": i.slug, "price": float(i.price)}
            for i in popular
        ],
    }


@router.get("/home")
async def home_payload(db: DbSession):
    """Aggregated home page data for fewer round-trips."""
    from app.services.content_service import ContentService
    from app.services.menu_service import MenuService

    menu = MenuService(db)
    content = ContentService(db)

    featured = await menu.featured_items(8)
    chef = await menu.chef_specials(6)
    categories = await menu.list_categories(active_only=True, featured_only=False)
    offers = await content.list_offers()
    reviews, _ = await content.list_reviews(approved_only=True, featured_only=True, page=1, page_size=6)
    gallery = await content.list_gallery(featured_only=True)
    rail = await menu.rail_specials(4)

    def item_brief(i: MenuItem) -> dict:
        return {
            "id": i.id,
            "name": i.name,
            "slug": i.slug,
            "price": float(i.price),
            "compare_at_price": float(i.compare_at_price) if i.compare_at_price else None,
            "image_url": i.image_url,
            "is_veg": i.is_veg,
            "spice_level": i.spice_level,
            "short_description": i.short_description,
            "is_chef_special": i.is_chef_special,
            "is_rail_special": i.is_rail_special,
            "rating_avg": float(i.rating_avg or 0),
            "category": i.category.name if i.category else None,
        }

    return {
        "featured_dishes": [item_brief(i) for i in featured],
        "chef_specials": [item_brief(i) for i in chef],
        "rail_specials": [item_brief(i) for i in rail],
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "image_url": c.image_url,
                "icon": c.icon,
                "description": c.description,
            }
            for c in categories
        ],
        "offers": [
            {
                "id": o.id,
                "title": o.title,
                "slug": o.slug,
                "description": o.description,
                "discount_label": o.discount_label,
                "coupon_code": o.coupon_code,
                "image_url": o.image_url,
            }
            for o in offers[:6]
        ],
        "testimonials": [
            {
                "id": r.id,
                "guest_name": r.guest_name or "Guest",
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
            }
            for r in reviews
        ],
        "gallery": [
            {
                "id": g.id,
                "title": g.title,
                "image_url": g.image_url,
                "alt_text": g.alt_text,
            }
            for g in gallery[:12]
        ],
        "stats": {
            "happy_customers": "10,000+",
            "dishes": "150+",
            "years": "5+",
            "rating": "4.8",
        },
    }


@router.get("/seo/sitemap-urls")
async def sitemap_urls(db: DbSession) -> List[dict[str, str]]:
    base = settings.app_url.rstrip("/")
    urls = [
        {"loc": f"{base}/", "priority": "1.0"},
        {"loc": f"{base}/menu", "priority": "0.9"},
        {"loc": f"{base}/reservation", "priority": "0.9"},
        {"loc": f"{base}/about", "priority": "0.7"},
        {"loc": f"{base}/gallery", "priority": "0.7"},
        {"loc": f"{base}/offers", "priority": "0.8"},
        {"loc": f"{base}/contact", "priority": "0.6"},
        {"loc": f"{base}/blog", "priority": "0.6"},
        {"loc": f"{base}/faqs", "priority": "0.5"},
    ]
    cats = (await db.execute(select(Category).where(Category.is_active.is_(True)))).scalars().all()
    for c in cats:
        urls.append({"loc": f"{base}/menu?category={c.slug}", "priority": "0.7"})
    items = (
        await db.execute(select(MenuItem).where(MenuItem.is_available.is_(True)).limit(200))
    ).scalars().all()
    for i in items:
        urls.append({"loc": f"{base}/menu/{i.slug}", "priority": "0.6"})
    posts = (
        await db.execute(select(BlogPost).where(BlogPost.status == "published"))
    ).scalars().all()
    for p in posts:
        urls.append({"loc": f"{base}/blog/{p.slug}", "priority": "0.5"})
    return urls
