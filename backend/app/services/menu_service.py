"""Menu and category services."""

from decimal import Decimal
from typing import Optional, Sequence, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import Category, MenuItem
from app.schemas.menu import (
    CategoryCreate,
    CategoryUpdate,
    MenuItemCreate,
    MenuItemFilter,
    MenuItemUpdate,
)
from app.utils.helpers import apply_updates, slugify


class MenuService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---- Categories ----
    async def list_categories(
        self, active_only: bool = True, featured_only: bool = False
    ) -> Sequence[Category]:
        q = select(Category).order_by(Category.sort_order, Category.name)
        if active_only:
            q = q.where(Category.is_active.is_(True))
        if featured_only:
            q = q.where(Category.is_featured.is_(True))
        result = await self.db.execute(q)
        return result.scalars().all()

    async def get_category(self, category_id: str) -> Optional[Category]:
        result = await self.db.execute(select(Category).where(Category.id == category_id))
        return result.scalar_one_or_none()

    async def get_category_by_slug(self, slug: str) -> Optional[Category]:
        result = await self.db.execute(select(Category).where(Category.slug == slug))
        return result.scalar_one_or_none()

    async def create_category(self, data: CategoryCreate) -> Category:
        slug = data.slug or slugify(data.name)
        cat = Category(**data.model_dump(exclude={"slug"}), slug=slug)
        self.db.add(cat)
        await self.db.flush()
        await self.db.refresh(cat)
        return cat

    async def update_category(self, cat: Category, data: CategoryUpdate) -> Category:
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and "slug" not in payload:
            payload["slug"] = slugify(payload["name"])
        apply_updates(cat, payload)
        await self.db.flush()
        await self.db.refresh(cat)
        return cat

    async def delete_category(self, cat: Category) -> None:
        await self.db.delete(cat)
        await self.db.flush()

    # ---- Menu items ----
    async def list_items(
        self, filters: MenuItemFilter
    ) -> Tuple[Sequence[MenuItem], int]:
        q = select(MenuItem).options(selectinload(MenuItem.category))
        count_q = select(func.count()).select_from(MenuItem)

        conditions = []
        if filters.is_available is not None:
            conditions.append(MenuItem.is_available.is_(filters.is_available))
        if filters.category_id:
            conditions.append(MenuItem.category_id == filters.category_id)
        if filters.category_slug:
            conditions.append(
                MenuItem.category_id.in_(
                    select(Category.id).where(Category.slug == filters.category_slug)
                )
            )
        if filters.is_veg is not None:
            conditions.append(MenuItem.is_veg.is_(filters.is_veg))
        if filters.spice_level is not None:
            conditions.append(MenuItem.spice_level == filters.spice_level)
        if filters.min_price is not None:
            conditions.append(MenuItem.price >= filters.min_price)
        if filters.max_price is not None:
            conditions.append(MenuItem.price <= filters.max_price)
        if filters.is_featured is not None:
            conditions.append(MenuItem.is_featured.is_(filters.is_featured))
        if filters.is_chef_special is not None:
            conditions.append(MenuItem.is_chef_special.is_(filters.is_chef_special))
        if filters.is_seasonal is not None:
            conditions.append(MenuItem.is_seasonal.is_(filters.is_seasonal))
        if filters.is_rail_special is not None:
            conditions.append(MenuItem.is_rail_special.is_(filters.is_rail_special))
        if filters.search:
            term = f"%{filters.search.strip()}%"
            conditions.append(
                or_(
                    MenuItem.name.ilike(term),
                    MenuItem.description.ilike(term),
                    MenuItem.tags.ilike(term),
                )
            )

        for c in conditions:
            q = q.where(c)
            count_q = count_q.where(c)

        sort_col = getattr(MenuItem, filters.sort_by, MenuItem.sort_order)
        if filters.sort_dir == "desc":
            q = q.order_by(sort_col.desc(), MenuItem.name)
        else:
            q = q.order_by(sort_col.asc(), MenuItem.name)

        total = (await self.db.execute(count_q)).scalar() or 0
        offset = (filters.page - 1) * filters.page_size
        q = q.offset(offset).limit(filters.page_size)
        result = await self.db.execute(q)
        return result.scalars().all(), total

    async def get_item(self, item_id: str) -> Optional[MenuItem]:
        result = await self.db.execute(
            select(MenuItem)
            .options(selectinload(MenuItem.category))
            .where(MenuItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def get_item_by_slug(self, slug: str) -> Optional[MenuItem]:
        result = await self.db.execute(
            select(MenuItem)
            .options(selectinload(MenuItem.category))
            .where(MenuItem.slug == slug)
        )
        return result.scalar_one_or_none()

    async def create_item(self, data: MenuItemCreate) -> MenuItem:
        slug = data.slug or slugify(data.name)
        item = MenuItem(**data.model_dump(exclude={"slug"}), slug=slug)
        self.db.add(item)
        await self.db.flush()
        return await self.get_item(item.id)

    async def update_item(self, item: MenuItem, data: MenuItemUpdate) -> MenuItem:
        payload = data.model_dump(exclude_unset=True)
        if "name" in payload and "slug" not in payload:
            payload["slug"] = slugify(payload["name"])
        apply_updates(item, payload)
        await self.db.flush()
        return await self.get_item(item.id)

    async def delete_item(self, item: MenuItem) -> None:
        await self.db.delete(item)
        await self.db.flush()

    async def featured_items(self, limit: int = 8) -> Sequence[MenuItem]:
        result = await self.db.execute(
            select(MenuItem)
            .options(selectinload(MenuItem.category))
            .where(MenuItem.is_featured.is_(True), MenuItem.is_available.is_(True))
            .order_by(MenuItem.sort_order)
            .limit(limit)
        )
        return result.scalars().all()

    async def chef_specials(self, limit: int = 8) -> Sequence[MenuItem]:
        result = await self.db.execute(
            select(MenuItem)
            .options(selectinload(MenuItem.category))
            .where(MenuItem.is_chef_special.is_(True), MenuItem.is_available.is_(True))
            .order_by(MenuItem.sort_order)
            .limit(limit)
        )
        return result.scalars().all()

    async def rail_specials(self, limit: int = 12) -> Sequence[MenuItem]:
        result = await self.db.execute(
            select(MenuItem)
            .options(selectinload(MenuItem.category))
            .where(MenuItem.is_rail_special.is_(True), MenuItem.is_available.is_(True))
            .order_by(MenuItem.sort_order)
            .limit(limit)
        )
        return result.scalars().all()
