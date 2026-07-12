"""Order endpoints."""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, OptionalUser, StaffUser
from app.models.order import Coupon
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.order import (
    CheckoutPreview,
    CouponCreate,
    CouponOut,
    CouponValidateRequest,
    CouponValidateResponse,
    OrderCreate,
    OrderOut,
    OrderStatusUpdate,
)
from app.services.order_service import OrderService
from app.utils.helpers import paginate

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/preview", response_model=CheckoutPreview)
async def preview_checkout(data: OrderCreate, db: DbSession):
    service = OrderService(db)
    try:
        totals = await service.preview_checkout(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return totals


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(data: OrderCreate, db: DbSession, user: OptionalUser):
    service = OrderService(db)
    try:
        order = await service.create_order(data, user=user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return order


@router.get("/mine", response_model=PaginatedResponse[OrderOut])
async def my_orders(
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = OrderService(db)
    items, total = await service.list_orders(
        user_id=user.id, page=page, page_size=page_size
    )
    return paginate(items, total, page, page_size)


@router.get("/track/{order_number}", response_model=OrderOut)
async def track_order(order_number: str, db: DbSession):
    service = OrderService(db)
    order = await service.get_by_number(order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/coupons/validate", response_model=CouponValidateResponse)
async def validate_coupon(data: CouponValidateRequest, db: DbSession):
    service = OrderService(db)
    coupon, discount, message = await service.validate_coupon(
        data.code, data.order_amount, data.order_type
    )
    return CouponValidateResponse(
        valid=coupon is not None,
        discount_amount=discount,
        message=message,
        coupon=CouponOut.model_validate(coupon) if coupon else None,
    )


@router.get("/coupons/list", response_model=List[CouponOut])
async def list_coupons(db: DbSession, _: AdminUser):
    result = await db.execute(select(Coupon).order_by(Coupon.created_at.desc()))
    return result.scalars().all()


@router.post("/coupons", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
async def create_coupon(data: CouponCreate, db: DbSession, _: AdminUser):
    coupon = Coupon(**data.model_dump())
    coupon.code = coupon.code.upper()
    db.add(coupon)
    await db.flush()
    await db.refresh(coupon)
    return coupon


@router.get("", response_model=PaginatedResponse[OrderOut])
async def list_all_orders(
    db: DbSession,
    _: StaffUser,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = OrderService(db)
    items, total = await service.list_orders(
        status=status_filter, page=page, page_size=page_size
    )
    return paginate(items, total, page, page_size)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, db: DbSession, user: CurrentUser):
    service = OrderService(db)
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user.id and not user.is_superuser and not user.has_role("admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: str, data: OrderStatusUpdate, db: DbSession, _: StaffUser
):
    service = OrderService(db)
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await service.update_status(order, data)
