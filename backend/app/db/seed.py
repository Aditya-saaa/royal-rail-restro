"""Database seed: roles, admin, categories, menu, content.

Async-safe: never touches lazy relationship collections.
Uses explicit association-table inserts only.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.content import FAQ, BlogPost, Event, GalleryImage, Offer, Review
from app.models.menu import Category, MenuItem
from app.models.order import Coupon
from app.models.settings import FeatureFlag, SiteSetting, ThemeSetting
from app.models.user import Permission, Role, RolePermission, User, UserRole
from app.utils.helpers import slugify


PERMISSIONS = [
    ("menu.read", "Read Menu", "menu"),
    ("menu.write", "Write Menu", "menu"),
    ("orders.read", "Read Orders", "orders"),
    ("orders.write", "Write Orders", "orders"),
    ("reservations.read", "Read Reservations", "reservations"),
    ("reservations.write", "Write Reservations", "reservations"),
    ("users.read", "Read Users", "users"),
    ("users.write", "Write Users", "users"),
    ("content.write", "Write Content", "content"),
    ("settings.write", "Write Settings", "settings"),
    ("developer.access", "Developer Access", "developer"),
]

ROLES = {
    "admin": [p[0] for p in PERMISSIONS],
    "manager": [
        "menu.read",
        "menu.write",
        "orders.read",
        "orders.write",
        "reservations.read",
        "reservations.write",
        "content.write",
        "users.read",
    ],
    "staff": [
        "orders.read",
        "orders.write",
        "reservations.read",
        "reservations.write",
        "menu.read",
    ],
    "developer": ["developer.access", "settings.write", "menu.read"],
    "customer": [],
}

CATEGORIES = [
    ("North Indian", "north-indian", "Classic curries, gravies & thalis", "🍛", 1),
    ("Chinese", "chinese", "Indo-Chinese favourites", "🥡", 2),
    ("Tandoor", "tandoor", "Clay oven specials", "🔥", 3),
    ("Fast Food", "fast-food", "Quick bites & street style", "🍟", 4),
    ("Pizza", "pizza", "Wood-fired & classic pizzas", "🍕", 5),
    ("Burgers", "burgers", "Gourmet burgers", "🍔", 6),
    ("Momos", "momos", "Steamed & fried dumplings", "🥟", 7),
    ("Soups", "soups", "Warm bowls of comfort", "🥣", 8),
    ("Rice & Biryani", "rice-biryani", "Aromatic rice dishes", "🍚", 9),
    ("Beverages", "beverages", "Mocktails, shakes & chai", "🥤", 10),
    ("Desserts", "desserts", "Sweet endings", "🍨", 11),
    ("Rail Special Thali", "rail-special-thali", "Signature railway thalis", "🚂", 0),
]

# name, category_slug, price, is_veg, spice, featured, chef, rail, short_desc
MENU_ITEMS = [
    ("Royal Rail Thali (Veg)", "rail-special-thali", 299, True, 2, True, True, True, "Complete veg thali with dal, sabzi, roti, rice, raita & dessert"),
    ("Royal Rail Thali (Non-Veg)", "rail-special-thali", 399, False, 3, True, True, True, "Chicken curry, dal, roti, rice, salad & dessert"),
    ("Butter Chicken", "north-indian", 320, False, 2, True, True, False, "Creamy tomato gravy with tender chicken"),
    ("Paneer Butter Masala", "north-indian", 280, True, 2, True, False, False, "Cottage cheese in rich butter masala"),
    ("Dal Makhani", "north-indian", 220, True, 1, True, False, False, "Slow-cooked black lentils with cream"),
    ("Chicken Biryani", "rice-biryani", 280, False, 3, True, True, False, "Aromatic basmati with spiced chicken"),
    ("Veg Biryani", "rice-biryani", 220, True, 2, True, False, False, "Fragrant vegetable biryani"),
    ("Tandoori Chicken", "tandoor", 350, False, 3, True, True, False, "Half chicken marinated in tandoori spices"),
    ("Paneer Tikka", "tandoor", 260, True, 2, True, False, False, "Grilled cottage cheese tikka"),
    ("Chilli Chicken", "chinese", 290, False, 4, True, False, False, "Indo-Chinese classic"),
    ("Veg Manchurian", "chinese", 220, True, 3, False, False, False, "Crispy veg balls in spicy sauce"),
    ("Hakka Noodles", "chinese", 180, True, 2, False, False, False, "Stir-fried noodles with veggies"),
    ("Margherita Pizza", "pizza", 249, True, 0, True, False, False, "Classic tomato, mozzarella & basil"),
    ("Chicken Dominator Pizza", "pizza", 349, False, 1, True, False, False, "Loaded chicken pizza"),
    ("Royal Burger", "burgers", 199, False, 1, True, False, False, "Juicy chicken patty with special sauce"),
    ("Veggie Crunch Burger", "burgers", 149, True, 1, False, False, False, "Crispy veg patty burger"),
    ("Steam Momos (Veg)", "momos", 120, True, 1, True, False, False, "8 pcs steamed veg momos"),
    ("Fried Chicken Momos", "momos", 160, False, 2, True, False, False, "8 pcs crispy chicken momos"),
    ("Tomato Soup", "soups", 99, True, 0, False, False, False, "Classic cream of tomato"),
    ("Hot & Sour Soup", "soups", 110, True, 3, False, False, False, "Spicy Indo-Chinese soup"),
    ("French Fries", "fast-food", 99, True, 0, False, False, False, "Crispy golden fries"),
    ("Masala Maggi", "fast-food", 80, True, 2, False, False, False, "Street-style masala noodles"),
    ("Mango Shake", "beverages", 120, True, 0, True, False, False, "Thick Alphonso mango shake"),
    ("Masala Chai", "beverages", 40, True, 0, False, False, False, "Authentic Indian spiced tea"),
    ("Cold Coffee", "beverages", 110, True, 0, False, False, False, "Chilled coffee with ice cream"),
    ("Gulab Jamun", "desserts", 80, True, 0, True, False, False, "2 pcs soft gulab jamun"),
    ("Brownie with Ice Cream", "desserts", 150, True, 0, True, True, False, "Warm brownie & vanilla scoop"),
    ("Rasmalai", "desserts", 100, True, 0, True, False, False, "2 pcs soft rasmalai"),
]


async def seed_all(db: AsyncSession, *, do_commit: bool = True) -> dict:
    """
    Idempotent seed. Safe for async SQLAlchemy / Neon.

    do_commit=True: commit at end (startup + dedicated seed session).
    do_commit=False: only flush (caller owns the transaction).
    """
    stats = {
        "permissions": 0,
        "roles": 0,
        "role_permissions": 0,
        "admin_created": False,
        "categories": 0,
        "menu_items": 0,
        "content": 0,
        "settings": 0,
    }
    try:
        stats["permissions"] = await _seed_permissions(db)
        stats["roles"], stats["role_permissions"] = await _seed_roles(db)
        stats["admin_created"] = await _seed_admin(db)
        stats["categories"], stats["menu_items"] = await _seed_categories_menu(db)
        stats["content"] = await _seed_content(db)
        stats["settings"] = await _seed_settings(db)
        if do_commit:
            await db.commit()
        else:
            await db.flush()
        return stats
    except Exception:
        if do_commit:
            await db.rollback()
        raise


async def _seed_permissions(db: AsyncSession) -> int:
    created = 0
    for code, name, module in PERMISSIONS:
        exists = (
            await db.execute(select(Permission.id).where(Permission.code == code))
        ).scalar_one_or_none()
        if exists:
            continue
        db.add(Permission(code=code, name=name, module=module))
        created += 1
    await db.flush()
    return created


async def _seed_roles(db: AsyncSession) -> tuple[int, int]:
    """Create roles + role_permissions via association rows only."""
    # Load permission ids by code
    perm_rows = (await db.execute(select(Permission.id, Permission.code))).all()
    perm_by_code = {code: pid for pid, code in perm_rows}

    roles_created = 0
    links_created = 0

    for role_name, codes in ROLES.items():
        role_id = (
            await db.execute(select(Role.id).where(Role.name == role_name))
        ).scalar_one_or_none()
        if not role_id:
            role = Role(
                name=role_name,
                description=f"{role_name.title()} role",
                is_system=True,
            )
            db.add(role)
            await db.flush()
            role_id = role.id
            roles_created += 1

        # Existing permission links for this role (column query only)
        existing = set(
            (
                await db.execute(
                    select(RolePermission.permission_id).where(
                        RolePermission.role_id == role_id
                    )
                )
            ).scalars().all()
        )

        for code in codes:
            pid = perm_by_code.get(code)
            if not pid or pid in existing:
                continue
            db.add(RolePermission(role_id=role_id, permission_id=pid))
            links_created += 1
            existing.add(pid)

    await db.flush()
    return roles_created, links_created


async def _seed_admin(db: AsyncSession) -> bool:
    email = settings.admin_email.lower()
    user_id = (
        await db.execute(select(User.id).where(User.email == email))
    ).scalar_one_or_none()
    if user_id:
        # Ensure admin role link exists even if user was created earlier
        admin_role_id = (
            await db.execute(select(Role.id).where(Role.name == "admin"))
        ).scalar_one_or_none()
        if admin_role_id:
            link = (
                await db.execute(
                    select(UserRole.user_id).where(
                        UserRole.user_id == user_id,
                        UserRole.role_id == admin_role_id,
                    )
                )
            ).scalar_one_or_none()
            if not link:
                db.add(UserRole(user_id=user_id, role_id=admin_role_id))
                await db.flush()
        return False

    user = User(
        email=email,
        password_hash=hash_password(settings.admin_password),
        full_name=settings.admin_name,
        is_active=True,
        is_verified=True,
        is_superuser=True,
    )
    db.add(user)
    await db.flush()

    admin_role_id = (
        await db.execute(select(Role.id).where(Role.name == "admin"))
    ).scalar_one_or_none()
    if admin_role_id:
        db.add(UserRole(user_id=user.id, role_id=admin_role_id))
        await db.flush()
    return True


async def _seed_categories_menu(db: AsyncSession) -> tuple[int, int]:
    cat_ids: dict[str, str] = {}
    cats_created = 0
    items_created = 0

    for name, slug, desc, icon, order in CATEGORIES:
        row = (
            await db.execute(select(Category.id).where(Category.slug == slug))
        ).scalar_one_or_none()
        if row:
            cat_ids[slug] = row
            continue
        cat = Category(
            name=name,
            slug=slug,
            description=desc,
            icon=icon,
            sort_order=order,
            is_active=True,
            is_featured=order <= 6,
        )
        db.add(cat)
        await db.flush()
        cat_ids[slug] = cat.id
        cats_created += 1

    for name, cat_slug, price, is_veg, spice, featured, chef, rail, short in MENU_ITEMS:
        item_slug = slugify(name)
        exists = (
            await db.execute(select(MenuItem.id).where(MenuItem.slug == item_slug))
        ).scalar_one_or_none()
        if exists:
            continue
        cat_id = cat_ids.get(cat_slug)
        if not cat_id:
            # load if missing from map
            cat_id = (
                await db.execute(select(Category.id).where(Category.slug == cat_slug))
            ).scalar_one_or_none()
        if not cat_id:
            continue
        item = MenuItem(
            category_id=cat_id,
            name=name,
            slug=item_slug,
            short_description=short,
            description=short,
            price=Decimal(str(price)),
            is_veg=is_veg,
            spice_level=spice,
            is_featured=featured,
            is_chef_special=chef,
            is_rail_special=rail,
            is_available=True,
            preparation_time_mins=25 if ("Biryani" in name or "Thali" in name) else 15,
            image_url=(
                f"https://placehold.co/600x400/8B0000/D4AF37?text={item_slug[:20]}"
            ),
            tags="signature" if featured else None,
        )
        db.add(item)
        items_created += 1

    await db.flush()
    return cats_created, items_created


async def _seed_content(db: AsyncSession) -> int:
    created = 0

    for code, desc, dtype, dval, min_amt in [
        ("WELCOME50", "₹50 off on first order", "fixed", 50, 199),
        ("RAIL10", "10% off on all orders", "percent", 10, 299),
        ("THALI20", "20% off on Rail Thali", "percent", 20, 250),
    ]:
        if (
            await db.execute(select(Coupon.id).where(Coupon.code == code))
        ).scalar_one_or_none():
            continue
        db.add(
            Coupon(
                code=code,
                description=desc,
                discount_type=dtype,
                discount_value=Decimal(str(dval)),
                min_order_amount=Decimal(str(min_amt)),
                max_discount=Decimal("100") if dtype == "percent" else None,
                is_active=True,
            )
        )
        created += 1

    for title, label, code in [
        ("Welcome Aboard Offer", "₹50 OFF", "WELCOME50"),
        ("Rail Special Weekend", "20% OFF Thali", "THALI20"),
        ("Family Feast Deal", "10% OFF", "RAIL10"),
    ]:
        s = slugify(title)
        if (
            await db.execute(select(Offer.id).where(Offer.slug == s))
        ).scalar_one_or_none():
            continue
        db.add(
            Offer(
                title=title,
                slug=s,
                description=f"Exclusive offer at Royal Rail Restro — {label}",
                discount_label=label,
                coupon_code=code,
                is_active=True,
                is_featured=True,
                image_url=f"https://placehold.co/800x400/8B0000/D4AF37?text={s[:15]}",
            )
        )
        created += 1

    faqs = [
        ("What are your opening hours?", "We are open daily from 11:00 AM to 10:30 PM (Friday–Saturday until 11:00 PM).", "general"),
        ("Do you offer home delivery?", "Yes, we deliver across major areas of Gaya. Delivery fee applies based on distance.", "ordering"),
        ("How can I reserve a table?", "Use our online reservation form or call us. You will receive confirmation shortly.", "reservation"),
        ("Is parking available?", "Yes, parking is available near Dev Raj Tower, Gewalbigha.", "general"),
        ("Do you have pure vegetarian options?", "Absolutely. We have a wide range of vegetarian North Indian, Chinese, and tandoor dishes.", "menu"),
        ("What is the Rail Special Thali?", "Our signature multi-course thali inspired by classic railway dining — available in veg and non-veg.", "menu"),
        ("Can I cancel my order?", "Orders can be cancelled before preparation starts. Contact us immediately after placing the order.", "ordering"),
        ("Do you host events?", "Yes, we host birthday parties, family gatherings, and small corporate events. Contact us for packages.", "events"),
    ]
    for q, a, cat in faqs:
        if (
            await db.execute(select(FAQ.id).where(FAQ.question == q))
        ).scalar_one_or_none():
            continue
        db.add(FAQ(question=q, answer=a, category=cat, is_active=True))
        created += 1

    reviews = [
        ("Amit Kumar", 5, "Best thali in Gaya!", "The Royal Rail Thali was outstanding. Portions are generous and taste is authentic."),
        ("Priya Singh", 5, "Family favourite", "We visit every weekend. Great ambience and polite staff."),
        ("Rahul Verma", 4, "Excellent biryani", "Chicken biryani is aromatic and perfectly spiced. Will order again."),
        ("Sneha Sharma", 5, "Perfect for celebrations", "Booked a table for birthday. Service was premium and cake presentation lovely."),
        ("Vikash Yadav", 4, "Good Chinese", "Chilli chicken and hakka noodles hit the spot. Fast delivery too."),
    ]
    for name, rating, title, comment in reviews:
        if (
            await db.execute(select(Review.id).where(Review.title == title))
        ).scalar_one_or_none():
            continue
        db.add(
            Review(
                guest_name=name,
                rating=rating,
                title=title,
                comment=comment,
                is_approved=True,
                is_featured=True,
            )
        )
        created += 1

    for i, title in enumerate(
        [
            "Dining Hall",
            "Signature Thali",
            "Tandoor Grill",
            "Family Table",
            "Dessert Platter",
            "Chef Special",
        ]
    ):
        if (
            await db.execute(select(GalleryImage.id).where(GalleryImage.title == title))
        ).scalar_one_or_none():
            continue
        db.add(
            GalleryImage(
                title=title,
                image_url=f"https://placehold.co/800x600/1a1a1a/D4AF37?text={slugify(title)}",
                category="interior" if i < 2 else "food",
                alt_text=f"{title} at Royal Rail Restro Gaya",
                sort_order=i,
                is_featured=True,
                is_active=True,
            )
        )
        created += 1

    blog_title = "The Story Behind Royal Rail Restro"
    blog_slug = slugify(blog_title)
    if not (
        await db.execute(select(BlogPost.id).where(BlogPost.slug == blog_slug))
    ).scalar_one_or_none():
        db.add(
            BlogPost(
                title=blog_title,
                slug=blog_slug,
                excerpt="How a love for classic railway dining inspired Gaya's premium family restaurant.",
                content=(
                    "## A Journey of Flavour\n\n"
                    "Royal Rail Restro was born from the nostalgia of long train journeys across India — "
                    "the aroma of hot chai, the clatter of steel thalis, and meals that felt like home.\n\n"
                    "Located at Dev Raj Tower, Gewalbigha, Gaya, we bring that warmth into a modern "
                    "family dining experience with North Indian classics, tandoor specials, Chinese "
                    "favourites, and our signature Rail Special Thali.\n\n"
                    "### Our Promise\n\n"
                    "Premium quality ingredients, honest pricing, and hospitality that makes every guest "
                    "feel like a first-class traveller."
                ),
                status="published",
                published_at=datetime.now(timezone.utc),
                is_featured=True,
                tags="story,brand,gaya",
                cover_image="https://placehold.co/1200x630/8B0000/D4AF37?text=Our+Story",
            )
        )
        created += 1

    event_title = "Weekend Live Music Dinner"
    event_slug = slugify(event_title)
    if not (
        await db.execute(select(Event.id).where(Event.slug == event_slug))
    ).scalar_one_or_none():
        db.add(
            Event(
                title=event_title,
                slug=event_slug,
                description="Enjoy live acoustic music with our special dinner menu every Saturday evening.",
                event_date=date.today() + timedelta(days=14),
                start_time="19:00",
                end_time="22:00",
                is_active=True,
            )
        )
        created += 1

    await db.flush()
    return created


async def _seed_settings(db: AsyncSession) -> int:
    created = 0
    site_defaults = [
        ("restaurant_tagline", "Premium Family Dining Inspired by the Rails", "general"),
        ("hero_title", "Welcome to Royal Rail Restro", "home"),
        ("hero_subtitle", "North Indian • Chinese • Tandoor • Signature Thalis", "home"),
        ("seo_default_title", "Royal Rail Restro | Best Family Restaurant in Gaya, Bihar", "seo"),
        (
            "seo_default_description",
            "Dine at Royal Rail Restro, Gewalbigha Gaya. North Indian, Chinese, Tandoor, Pizza & Rail Special Thali. Book a table or order online.",
            "seo",
        ),
    ]
    for key, value, group in site_defaults:
        if (
            await db.execute(select(SiteSetting.id).where(SiteSetting.key == key))
        ).scalar_one_or_none():
            continue
        db.add(
            SiteSetting(
                key=key,
                value=value,
                group=group,
                is_public=True,
                label=key.replace("_", " ").title(),
            )
        )
        created += 1

    theme_defaults = {
        "primary": "#8B0000",
        "gold": "#D4AF37",
        "charcoal": "#1A1A1A",
        "cream": "#F5F0E8",
        "font_heading": "Playfair Display",
        "font_body": "Inter",
        "border_radius": "12px",
    }
    for key, value in theme_defaults.items():
        if (
            await db.execute(select(ThemeSetting.id).where(ThemeSetting.key == key))
        ).scalar_one_or_none():
            continue
        category = "colors" if key in ("primary", "gold", "charcoal", "cream") else "typography"
        if key == "border_radius":
            category = "layout"
        db.add(ThemeSetting(key=key, value=value, category=category))
        created += 1

    flags = [
        ("online_ordering", True, "Enable online ordering"),
        ("table_reservation", True, "Enable table reservations"),
        ("loyalty_program", True, "Enable loyalty points"),
        ("dark_mode", True, "Allow dark mode toggle"),
        ("pwa", True, "Enable PWA features"),
        ("live_chat", False, "Enable live chat widget"),
    ]
    for key, enabled, desc in flags:
        if (
            await db.execute(select(FeatureFlag.id).where(FeatureFlag.key == key))
        ).scalar_one_or_none():
            continue
        db.add(FeatureFlag(key=key, enabled=enabled, description=desc))
        created += 1

    await db.flush()
    return created
