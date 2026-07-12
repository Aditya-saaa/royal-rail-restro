"""Menu and category schemas."""

from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    is_featured: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    item_count: Optional[int] = None


class MenuItemBase(BaseModel):
    category_id: str
    name: str = Field(min_length=2, max_length=150)
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Decimal = Field(gt=0)
    compare_at_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    gallery_urls: Optional[str] = None
    is_veg: bool = True
    spice_level: int = Field(default=0, ge=0, le=5)
    is_available: bool = True
    is_featured: bool = False
    is_chef_special: bool = False
    is_seasonal: bool = False
    is_rail_special: bool = False
    preparation_time_mins: int = 20
    calories: Optional[int] = None
    protein_g: Optional[Decimal] = None
    carbs_g: Optional[Decimal] = None
    fat_g: Optional[Decimal] = None
    allergens: Optional[str] = None
    recommended_pairing: Optional[str] = None
    sort_order: int = 0
    stock_quantity: Optional[int] = None
    tags: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    gallery_urls: Optional[str] = None
    is_veg: Optional[bool] = None
    spice_level: Optional[int] = Field(default=None, ge=0, le=5)
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_chef_special: Optional[bool] = None
    is_seasonal: Optional[bool] = None
    is_rail_special: Optional[bool] = None
    preparation_time_mins: Optional[int] = None
    calories: Optional[int] = None
    protein_g: Optional[Decimal] = None
    carbs_g: Optional[Decimal] = None
    fat_g: Optional[Decimal] = None
    allergens: Optional[str] = None
    recommended_pairing: Optional[str] = None
    sort_order: Optional[int] = None
    stock_quantity: Optional[int] = None
    tags: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class CategoryBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str


class MenuItemOut(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rating_avg: Decimal = Decimal("0.00")
    rating_count: int = 0
    category: Optional[CategoryBrief] = None


class MenuItemFilter(BaseModel):
    search: Optional[str] = None
    category_id: Optional[str] = None
    category_slug: Optional[str] = None
    is_veg: Optional[bool] = None
    spice_level: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    is_available: Optional[bool] = True
    is_featured: Optional[bool] = None
    is_chef_special: Optional[bool] = None
    is_seasonal: Optional[bool] = None
    is_rail_special: Optional[bool] = None
    sort_by: str = "sort_order"
    sort_dir: str = "asc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
