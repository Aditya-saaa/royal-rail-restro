"""Order and coupon schemas."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrderItemCreate(BaseModel):
    menu_item_id: str
    quantity: int = Field(ge=1, le=50)
    special_notes: Optional[str] = Field(default=None, max_length=255)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1)
    order_type: str = Field(default="delivery", pattern="^(delivery|pickup|dine_in)$")
    payment_method: Optional[str] = "cod"
    coupon_code: Optional[str] = None
    delivery_address: Optional[str] = None
    special_instructions: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    menu_item_id: Optional[str] = None
    name: str
    is_veg: bool
    unit_price: Decimal
    quantity: int
    line_total: Decimal
    special_notes: Optional[str] = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    user_id: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    order_type: str
    status: str
    payment_status: str
    payment_method: Optional[str] = None
    subtotal: Decimal
    discount_amount: Decimal
    delivery_fee: Decimal
    gst_amount: Decimal
    packing_fee: Decimal
    total_amount: Decimal
    coupon_code: Optional[str] = None
    delivery_address: Optional[str] = None
    special_instructions: Optional[str] = None
    tracking_status: Optional[str] = None
    invoice_number: Optional[str] = None
    estimated_ready_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    items: List[OrderItemOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class OrderStatusUpdate(BaseModel):
    status: str
    cancel_reason: Optional[str] = None
    tracking_status: Optional[str] = None


class CouponCreate(BaseModel):
    code: str = Field(min_length=3, max_length=40)
    description: Optional[str] = None
    discount_type: str = Field(default="percent", pattern="^(percent|fixed)$")
    discount_value: Decimal = Field(gt=0)
    min_order_amount: Decimal = Decimal("0")
    max_discount: Optional[Decimal] = None
    usage_limit: Optional[int] = None
    per_user_limit: int = 1
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True
    applicable_to: str = "all"


class CouponOut(CouponCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    used_count: int = 0


class CouponValidateRequest(BaseModel):
    code: str
    order_amount: Decimal
    order_type: str = "delivery"


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_amount: Decimal = Decimal("0")
    message: str
    coupon: Optional[CouponOut] = None


class CheckoutPreview(BaseModel):
    subtotal: Decimal
    discount_amount: Decimal
    delivery_fee: Decimal
    gst_amount: Decimal
    packing_fee: Decimal
    total_amount: Decimal
    gst_percent: float
