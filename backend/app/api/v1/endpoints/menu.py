"""Menu & category public + admin endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import AdminUser, DbSession
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.menu import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    MenuItemCreate,
    MenuItemFilter,
    MenuItemOut,
    MenuItemUpdate,
)
from app.services.menu_service import MenuService
from app.utils.helpers import paginate

router = APIRouter(prefix="/menu", tags=["Menu"])


@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(
    db: DbSession,
    active_only: bool = True,
    featured_only: bool = False,
):
    service = MenuService(db)
    cats = await service.list_categories(active_only=active_only, featured_only=featured_only)
    return cats


@router.get("/categories/{slug}", response_model=CategoryOut)
async def get_category(slug: str, db: DbSession):
    service = MenuService(db)
    cat = await service.get_category_by_slug(slug)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(data: CategoryCreate, db: DbSession, _: AdminUser):
    service = MenuService(db)
    return await service.create_category(data)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: str, data: CategoryUpdate, db: DbSession, _: AdminUser
):
    service = MenuService(db)
    cat = await service.get_category(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return await service.update_category(cat, data)


@router.delete("/categories/{category_id}", response_model=MessageResponse)
async def delete_category(category_id: str, db: DbSession, _: AdminUser):
    service = MenuService(db)
    cat = await service.get_category(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await service.delete_category(cat)
    return MessageResponse(message="Category deleted")


@router.get("/items", response_model=PaginatedResponse[MenuItemOut])
async def list_items(
    db: DbSession,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    category_slug: Optional[str] = None,
    is_veg: Optional[bool] = None,
    spice_level: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_available: Optional[bool] = True,
    is_featured: Optional[bool] = None,
    is_chef_special: Optional[bool] = None,
    is_seasonal: Optional[bool] = None,
    is_rail_special: Optional[bool] = None,
    sort_by: str = "sort_order",
    sort_dir: str = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    filters = MenuItemFilter(
        search=search,
        category_id=category_id,
        category_slug=category_slug,
        is_veg=is_veg,
        spice_level=spice_level,
        min_price=min_price,
        max_price=max_price,
        is_available=is_available,
        is_featured=is_featured,
        is_chef_special=is_chef_special,
        is_seasonal=is_seasonal,
        is_rail_special=is_rail_special,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    service = MenuService(db)
    items, total = await service.list_items(filters)
    return paginate(items, total, page, page_size)


@router.get("/items/featured", response_model=List[MenuItemOut])
async def featured_items(db: DbSession, limit: int = Query(8, ge=1, le=24)):
    service = MenuService(db)
    return await service.featured_items(limit)


@router.get("/items/chef-specials", response_model=List[MenuItemOut])
async def chef_specials(db: DbSession, limit: int = Query(8, ge=1, le=24)):
    service = MenuService(db)
    return await service.chef_specials(limit)


@router.get("/items/rail-specials", response_model=List[MenuItemOut])
async def rail_specials(db: DbSession, limit: int = Query(12, ge=1, le=24)):
    service = MenuService(db)
    return await service.rail_specials(limit)


@router.get("/items/{item_id}", response_model=MenuItemOut)
async def get_item(item_id: str, db: DbSession):
    service = MenuService(db)
    item = await service.get_item(item_id)
    if not item:
        # try slug
        item = await service.get_item_by_slug(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


@router.post("/items", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(data: MenuItemCreate, db: DbSession, _: AdminUser):
    service = MenuService(db)
    return await service.create_item(data)


@router.patch("/items/{item_id}", response_model=MenuItemOut)
async def update_item(
    item_id: str, data: MenuItemUpdate, db: DbSession, _: AdminUser
):
    service = MenuService(db)
    item = await service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return await service.update_item(item, data)


@router.delete("/items/{item_id}", response_model=MessageResponse)
async def delete_item(item_id: str, db: DbSession, _: AdminUser):
    service = MenuService(db)
    item = await service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    await service.delete_item(item)
    return MessageResponse(message="Menu item deleted")
