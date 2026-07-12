"""Database seed: roles, admin, categories, menu, content."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import hash_password
from app.models.content import FAQ, BlogPost, Event, GalleryImage, Offer, Review
from app.models.menu import Category, MenuItem
from app.models.order import Coupon
from app.models.settings import FeatureFlag, SiteSetting, ThemeSetting
from app.models.user import Permission, Role, User
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
    "admin": list(p[0] for p in PERMISSIONS),
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
    "staff": ["orders.read", "orders.write", "reservations.read", "reservations.write", "menu.read"],
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
    ("Rasmalai", "desserts", 100, True, 0, False, False, False, "2 pcs soft rasmalai"),
]


async def seed_all(db: AsyncSession) -> None:
    await _seed_permissions_roles(db)
    await _seed_admin(db)
    await _seed_categories_menu(db)
    await _seed_content(db)
    await _seed_settings(db)
    await db.commit()


async def _seed_permissions_roles(db: AsyncSession) -> None:
    perm_map: dict[str, Permission] = {}
    for code, name, module in PERMISSIONS:
        result = await db.execute(select(Permission).where(Permission.code == code))
        perm = result.scalar_one_or_none()
        if not perm:
            perm = Permission(code=code, name=name, module=module)
            db.add(perm)
            await db.flush()
        perm_map[code] = perm

    for role_name, codes in ROLES.items():
        result = await db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.name == role_name)
        )
        role = result.scalar_one_or_none()
        if not role:
            role = Role(
                name=role_name,
                description=f"{role_name.title()} role",
                is_system=True,
            )
            db.add(role)
            await db.flush()
            await db.refresh(role, attribute_names=["permissions"])
        existing = {p.code for p in role.permissions}
        for code in codes:
            if code not in existing and code in perm_map:
                role.permissions.append(perm_map[code])
        await db.flush()


async def _seed_admin(db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.email == settings.admin_email.lower()))
    user = result.scalar_one_or_none()
    if user:
        return
    role_result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).where(Role.name == "admin")
    )
    admin_role = role_result.scalar_one_or_none()
    user = User(
        email=settings.admin_email.lower(),
        password_hash=hash_password(settings.admin_password),
        full_name=settings.admin_name,
        is_active=True,
        is_verified=True,
        is_superuser=True,
    )
    db.add(user)
    await db.flush()
    if admin_role:
        user.roles.append(admin_role)
    await db.flush()


async def _seed_categories_menu(db: AsyncSession) -> None:
    cat_map: dict[str, Category] = {}
    for name, slug, desc, icon, order in CATEGORIES:
        result = await db.execute(select(Category).where(Category.slug == slug))
        cat = result.scalar_one_or_none()
        if not cat:
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
        cat_map[slug] = cat

    for name, cat_slug, price, is_veg, spice, featured, chef, rail, short in MENU_ITEMS:
        slug = slugify(name)
        result = await db.execute(select(MenuItem).where(MenuItem.slug == slug))
        if result.scalar_one_or_none():
            continue
        cat = cat_map.get(cat_slug)
        if not cat:
            continue
        item = MenuItem(
            category_id=cat.id,
            name=name,
            slug=slug,
            short_description=short,
            description=short,
            price=Decimal(str(price)),
            is_veg=is_veg,
            spice_level=spice,
            is_featured=featured,
            is_chef_special=chef,
            is_rail_special=rail,
            is_available=True,
            preparation_time_mins=25 if "Biryani" in name or "Thali" in name else 15,
            image_url=f"https://placehold.co/600x400/8B0000/D4AF37?text={slugify(name)[:20]}",
            tags="signature" if featured else None,
        )
        db.add(item)
    await db.flush()


async def _seed_content(db: AsyncSession) -> None:
    # Coupons
    for code, desc, dtype, dval, min_amt in [
        ("WELCOME50", "₹50 off on first order", "fixed", 50, 199),
        ("RAIL10", "10% off on all orders", "percent", 10, 299),
        ("THALI20", "20% off on Rail Thali", "percent", 20, 250),
    ]:
        result = await db.execute(select(Coupon).where(Coupon.code == code))
        if not result.scalar_one_or_none():
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

    # Offers
    for title, label, code in [
        ("Welcome Aboard Offer", "₹50 OFF", "WELCOME50"),
        ("Rail Special Weekend", "20% OFF Thali", "THALI20"),
        ("Family Feast Deal", "10% OFF", "RAIL10"),
    ]:
        slug = slugify(title)
        result = await db.execute(select(Offer).where(Offer.slug == slug))
        if not result.scalar_one_or_none():
            db.add(
                Offer(
                    title=title,
                    slug=slug,
                    description=f"Exclusive offer at Royal Rail Restro — {label}",
                    discount_label=label,
                    coupon_code=code,
                    is_active=True,
                    is_featured=True,
                    image_url=f"https://placehold.co/800x400/8B0000/D4AF37?text={slug[:15]}",
                )
            )

    # FAQs
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
        result = await db.execute(select(FAQ).where(FAQ.question == q))
        if not result.scalar_one_or_none():
            db.add(FAQ(question=q, answer=a, category=cat, is_active=True))

    # Reviews
    reviews = [
        ("Amit Kumar", 5, "Best thali in Gaya!", "The Royal Rail Thali was outstanding. Portions are generous and taste is authentic."),
        ("Priya Singh", 5, "Family favourite", "We visit every weekend. Great ambience and polite staff."),
        ("Rahul Verma", 4, "Excellent biryani", "Chicken biryani is aromatic and perfectly spiced. Will order again."),
        ("Sneha Sharma", 5, "Perfect for celebrations", "Booked a table for birthday. Service was premium and cake presentation lovely."),
        ("Vikash Yadav", 4, "Good Chinese", "Chilli chicken and hakka noodles hit the spot. Fast delivery too."),
    ]
    for name, rating, title, comment in reviews:
        result = await db.execute(select(Review).where(Review.title == title))
        if not result.scalar_one_or_none():
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

    # Gallery
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
        result = await db.execute(select(GalleryImage).where(GalleryImage.title == title))
        if not result.scalar_one_or_none():
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

    # Blog
    blog_title = "The Story Behind Royal Rail Restro"
    slug = slugify(blog_title)
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    if not result.scalar_one_or_none():
        from datetime import datetime, timezone

        db.add(
            BlogPost(
                title=blog_title,
                slug=slug,
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

    # Event
    from datetime import date, timedelta

    event_title = "Weekend Live Music Dinner"
    eslug = slugify(event_title)
    result = await db.execute(select(Event).where(Event.slug == eslug))
    if not result.scalar_one_or_none():
        db.add(
            Event(
                title=event_title,
                slug=eslug,
                description="Enjoy live acoustic music with our special dinner menu every Saturday evening.",
                event_date=date.today() + timedelta(days=14),
                start_time="19:00",
                end_time="22:00",
                is_active=True,
            )
        )

    await db.flush()


async def _seed_settings(db: AsyncSession) -> None:
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
        result = await db.execute(select(SiteSetting).where(SiteSetting.key == key))
        if not result.scalar_one_or_none():
            db.add(
                SiteSetting(
                    key=key, value=value, group=group, is_public=True, label=key.replace("_", " ").title()
                )
            )

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
        result = await db.execute(select(ThemeSetting).where(ThemeSetting.key == key))
        if not result.scalar_one_or_none():
            category = "colors" if key in ("primary", "gold", "charcoal", "cream") else "typography"
            if key == "border_radius":
                category = "layout"
            db.add(ThemeSetting(key=key, value=value, category=category))

    flags = [
        ("online_ordering", True, "Enable online ordering"),
        ("table_reservation", True, "Enable table reservations"),
        ("loyalty_program", True, "Enable loyalty points"),
        ("dark_mode", True, "Allow dark mode toggle"),
        ("pwa", True, "Enable PWA features"),
        ("live_chat", False, "Enable live chat widget"),
    ]
    for key, enabled, desc in flags:
        result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
        if not result.scalar_one_or_none():
            db.add(FeatureFlag(key=key, enabled=enabled, description=desc))

    await db.flush()
