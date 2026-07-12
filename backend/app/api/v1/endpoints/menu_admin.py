"""Admin menu bulk operations (extends /menu without breaking public routes)."""

from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession
from app.models.menu import MenuItem
from app.schemas.common import MessageResponse
from app.schemas.menu import MenuItemCreate, MenuItemOut
from app.services.menu_service import MenuService
from app.utils.helpers import slugify

router = APIRouter(prefix="/menu/admin", tags=["Menu Admin"])


class BulkIds(BaseModel):
    ids: List[str] = Field(min_length=1)


class BulkAvailability(BulkIds):
    is_available: bool


class BulkCategory(BulkIds):
    category_id: str


class BulkPrice(BulkIds):
    mode: str = Field(pattern="^(set|percent|fixed)$")
    value: Decimal


class BulkFlags(BulkIds):
    is_featured: Optional[bool] = None
    is_chef_special: Optional[bool] = None
    is_rail_special: Optional[bool] = None
    is_seasonal: Optional[bool] = None


class SortItem(BaseModel):
    id: str
    sort_order: int


class SortPayload(BaseModel):
    items: List[SortItem]


class DuplicateRequest(BaseModel):
    name_suffix: str = " (Copy)"


async def _load_items(db: DbSession, ids: List[str]) -> list[MenuItem]:
    result = await db.execute(select(MenuItem).where(MenuItem.id.in_(ids)))
    return list(result.scalars().all())


@router.post("/bulk/delete", response_model=MessageResponse)
async def bulk_delete(data: BulkIds, db: DbSession, _: AdminUser):
    items = await _load_items(db, data.ids)
    for item in items:
        await db.delete(item)
    await db.flush()
    return MessageResponse(message=f"Deleted {len(items)} items")


@router.post("/bulk/availability", response_model=MessageResponse)
async def bulk_availability(data: BulkAvailability, db: DbSession, _: AdminUser):
    items = await _load_items(db, data.ids)
    for item in items:
        item.is_available = data.is_available
    await db.flush()
    return MessageResponse(message=f"Updated availability for {len(items)} items")


@router.post("/bulk/category", response_model=MessageResponse)
async def bulk_category(data: BulkCategory, db: DbSession, _: AdminUser):
    items = await _load_items(db, data.ids)
    for item in items:
        item.category_id = data.category_id
    await db.flush()
    return MessageResponse(message=f"Moved {len(items)} items")


@router.post("/bulk/price", response_model=MessageResponse)
async def bulk_price(data: BulkPrice, db: DbSession, _: AdminUser):
    items = await _load_items(db, data.ids)
    for item in items:
        price = Decimal(str(item.price))
        if data.mode == "set":
            item.price = data.value
        elif data.mode == "percent":
            item.price = (price * (Decimal("1") + data.value / Decimal("100"))).quantize(
                Decimal("0.01")
            )
        else:
            item.price = (price + data.value).quantize(Decimal("0.01"))
    await db.flush()
    return MessageResponse(message=f"Updated prices for {len(items)} items")


@router.post("/bulk/flags", response_model=MessageResponse)
async def bulk_flags(data: BulkFlags, db: DbSession, _: AdminUser):
    items = await _load_items(db, data.ids)
    for item in items:
        if data.is_featured is not None:
            item.is_featured = data.is_featured
        if data.is_chef_special is not None:
            item.is_chef_special = data.is_chef_special
        if data.is_rail_special is not None:
            item.is_rail_special = data.is_rail_special
        if data.is_seasonal is not None:
            item.is_seasonal = data.is_seasonal
    await db.flush()
    return MessageResponse(message=f"Updated flags for {len(items)} items")


@router.post("/sort", response_model=MessageResponse)
async def sort_items(data: SortPayload, db: DbSession, _: AdminUser):
    id_map = {i.id: i.sort_order for i in data.items}
    items = await _load_items(db, list(id_map.keys()))
    for item in items:
        item.sort_order = id_map[item.id]
    await db.flush()
    return MessageResponse(message="Sort order updated")


@router.post("/items/{item_id}/duplicate", response_model=MenuItemOut)
async def duplicate_item(
    item_id: str, data: DuplicateRequest, db: DbSession, _: AdminUser
):
    service = MenuService(db)
    item = await service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    name = f"{item.name}{data.name_suffix}"
    payload = MenuItemCreate(
        category_id=item.category_id,
        name=name,
        slug=slugify(name) + "-" + item.id[:6],
        description=item.description,
        short_description=item.short_description,
        price=item.price,
        compare_at_price=item.compare_at_price,
        image_url=item.image_url,
        gallery_urls=item.gallery_urls,
        is_veg=item.is_veg,
        spice_level=item.spice_level,
        is_available=False,
        is_featured=False,
        is_chef_special=item.is_chef_special,
        is_seasonal=item.is_seasonal,
        is_rail_special=item.is_rail_special,
        preparation_time_mins=item.preparation_time_mins,
        calories=item.calories,
        protein_g=item.protein_g,
        carbs_g=item.carbs_g,
        fat_g=item.fat_g,
        allergens=item.allergens,
        recommended_pairing=item.recommended_pairing,
        sort_order=item.sort_order,
        stock_quantity=item.stock_quantity,
        tags=item.tags,
        meta_title=item.meta_title,
        meta_description=item.meta_description,
    )
    return await service.create_item(payload)


@router.post("/items/{item_id}/archive", response_model=MenuItemOut)
async def archive_item(item_id: str, db: DbSession, _: AdminUser):
    service = MenuService(db)
    item = await service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    item.is_available = False
    tags = (item.tags or "").split(",")
    if "archived" not in tags:
        tags.append("archived")
    item.tags = ",".join(t for t in tags if t)
    await db.flush()
    return await service.get_item(item_id)


@router.post("/items/{item_id}/restore", response_model=MenuItemOut)
async def restore_item(item_id: str, db: DbSession, _: AdminUser):
    service = MenuService(db)
    item = await service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    item.is_available = True
    if item.tags:
        tags = [t for t in item.tags.split(",") if t and t != "archived"]
        item.tags = ",".join(tags) or None
    await db.flush()
    return await service.get_item(item_id)
