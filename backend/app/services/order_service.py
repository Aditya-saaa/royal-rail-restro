"""Order and coupon services."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.menu import MenuItem
from app.models.order import Coupon, Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.utils.helpers import generate_invoice_number, generate_order_number


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.gst_percent = Decimal(str(settings.gst_percent))

    def _calc_totals(
        self,
        subtotal: Decimal,
        discount: Decimal,
        order_type: str,
    ) -> dict[str, Decimal]:
        delivery_fee = Decimal("40.00") if order_type == "delivery" else Decimal("0")
        packing_fee = Decimal("10.00") if order_type in ("delivery", "pickup") else Decimal("0")
        taxable = max(subtotal - discount + packing_fee, Decimal("0"))
        gst = (taxable * self.gst_percent / Decimal("100")).quantize(Decimal("0.01"))
        total = taxable + gst + delivery_fee
        return {
            "subtotal": subtotal.quantize(Decimal("0.01")),
            "discount_amount": discount.quantize(Decimal("0.01")),
            "delivery_fee": delivery_fee,
            "packing_fee": packing_fee,
            "gst_amount": gst,
            "total_amount": total.quantize(Decimal("0.01")),
        }

    async def validate_coupon(
        self, code: str, order_amount: Decimal, order_type: str, user_id: Optional[str] = None
    ) -> Tuple[Optional[Coupon], Decimal, str]:
        result = await self.db.execute(
            select(Coupon).where(Coupon.code == code.upper(), Coupon.is_active.is_(True))
        )
        coupon = result.scalar_one_or_none()
        if not coupon:
            return None, Decimal("0"), "Invalid coupon code"
        now = datetime.now(timezone.utc)
        if coupon.starts_at and coupon.starts_at > now:
            return None, Decimal("0"), "Coupon not yet active"
        if coupon.ends_at and coupon.ends_at < now:
            return None, Decimal("0"), "Coupon has expired"
        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            return None, Decimal("0"), "Coupon usage limit reached"
        if order_amount < coupon.min_order_amount:
            return None, Decimal("0"), f"Minimum order amount is ₹{coupon.min_order_amount}"
        if coupon.applicable_to != "all" and coupon.applicable_to != order_type:
            return None, Decimal("0"), f"Coupon only valid for {coupon.applicable_to}"

        if coupon.discount_type == "percent":
            discount = (order_amount * coupon.discount_value / Decimal("100")).quantize(
                Decimal("0.01")
            )
            if coupon.max_discount is not None:
                discount = min(discount, coupon.max_discount)
        else:
            discount = min(coupon.discount_value, order_amount)

        return coupon, discount, "Coupon applied successfully"

    async def create_order(
        self, data: OrderCreate, user: Optional[User] = None
    ) -> Order:
        if not data.items:
            raise ValueError("Order must contain at least one item")

        subtotal = Decimal("0")
        line_items: list[dict] = []

        for line in data.items:
            item_result = await self.db.execute(
                select(MenuItem).where(MenuItem.id == line.menu_item_id)
            )
            menu_item = item_result.scalar_one_or_none()
            if not menu_item:
                raise ValueError(f"Menu item not found: {line.menu_item_id}")
            if not menu_item.is_available:
                raise ValueError(f"{menu_item.name} is currently unavailable")
            unit = Decimal(str(menu_item.price))
            line_total = (unit * line.quantity).quantize(Decimal("0.01"))
            subtotal += line_total
            line_items.append(
                {
                    "menu_item": menu_item,
                    "quantity": line.quantity,
                    "unit_price": unit,
                    "line_total": line_total,
                    "special_notes": line.special_notes,
                }
            )

        discount = Decimal("0")
        coupon_obj: Optional[Coupon] = None
        if data.coupon_code:
            coupon_obj, discount, msg = await self.validate_coupon(
                data.coupon_code, subtotal, data.order_type, user.id if user else None
            )
            if not coupon_obj:
                raise ValueError(msg)

        totals = self._calc_totals(subtotal, discount, data.order_type)

        if data.order_type == "delivery" and not data.delivery_address and not user:
            raise ValueError("Delivery address is required")

        order = Order(
            order_number=generate_order_number(),
            user_id=user.id if user else None,
            guest_name=data.guest_name or (user.full_name if user else None),
            guest_email=data.guest_email or (user.email if user else None),
            guest_phone=data.guest_phone or (user.phone if user else None),
            order_type=data.order_type,
            status="pending",
            payment_status="pending" if data.payment_method != "cod" else "pending",
            payment_method=data.payment_method or "cod",
            coupon_id=coupon_obj.id if coupon_obj else None,
            coupon_code=coupon_obj.code if coupon_obj else None,
            delivery_address=data.delivery_address,
            special_instructions=data.special_instructions,
            invoice_number=generate_invoice_number(),
            **totals,
        )
        self.db.add(order)
        await self.db.flush()

        for li in line_items:
            oi = OrderItem(
                order_id=order.id,
                menu_item_id=li["menu_item"].id,
                name=li["menu_item"].name,
                is_veg=li["menu_item"].is_veg,
                unit_price=li["unit_price"],
                quantity=li["quantity"],
                line_total=li["line_total"],
                special_notes=li["special_notes"],
            )
            self.db.add(oi)

        if coupon_obj:
            coupon_obj.used_count = (coupon_obj.used_count or 0) + 1

        await self.db.flush()
        return await self.get_order(order.id)

    async def get_order(self, order_id: str) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, order_number: str) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.order_number == order_number)
        )
        return result.scalar_one_or_none()

    async def list_orders(
        self,
        *,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[Sequence[Order], int]:
        q = select(Order).options(selectinload(Order.items))
        count_q = select(func.count()).select_from(Order)
        if user_id:
            q = q.where(Order.user_id == user_id)
            count_q = count_q.where(Order.user_id == user_id)
        if status:
            q = q.where(Order.status == status)
            count_q = count_q.where(Order.status == status)
        total = (await self.db.execute(count_q)).scalar() or 0
        q = q.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(q)
        return result.scalars().all(), total

    async def update_status(self, order: Order, data: OrderStatusUpdate) -> Order:
        order.status = data.status
        if data.tracking_status:
            order.tracking_status = data.tracking_status
        if data.status == "cancelled":
            order.cancelled_at = datetime.now(timezone.utc)
            order.cancel_reason = data.cancel_reason
        if data.status == "delivered":
            order.delivered_at = datetime.now(timezone.utc)
            order.payment_status = "paid"
            order.tracking_status = "delivered"
        if data.status == "confirmed":
            order.tracking_status = "confirmed"
        await self.db.flush()
        return await self.get_order(order.id)

    async def preview_checkout(
        self, data: OrderCreate
    ) -> dict:
        subtotal = Decimal("0")
        for line in data.items:
            item_result = await self.db.execute(
                select(MenuItem).where(MenuItem.id == line.menu_item_id)
            )
            menu_item = item_result.scalar_one_or_none()
            if not menu_item:
                raise ValueError(f"Menu item not found: {line.menu_item_id}")
            subtotal += Decimal(str(menu_item.price)) * line.quantity

        discount = Decimal("0")
        if data.coupon_code:
            _, discount, _ = await self.validate_coupon(
                data.coupon_code, subtotal, data.order_type
            )
        totals = self._calc_totals(subtotal, discount, data.order_type)
        totals["gst_percent"] = float(self.gst_percent)
        return totals
