"""Operations: kitchen board, invoice, exports, backups."""

from __future__ import annotations

import csv
import io
import json
from datetime import date, datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, DbSession, StaffUser
from app.models.content import BlogPost, Event, FAQ, GalleryImage, Offer, Review
from app.models.menu import Category, MenuItem
from app.models.order import Coupon, Order
from app.models.reservation import Reservation
from app.models.settings import FeatureFlag, SiteSetting, ThemeSetting
from app.models.user import User
from app.services.audit_service import log_activity
from app.utils.helpers import paginate

router = APIRouter(prefix="/ops", tags=["Operations"])


# ---------- Kitchen / live orders ----------
@router.get("/kitchen")
async def kitchen_board(db: DbSession, _: StaffUser):
    """Live kitchen view: active orders not delivered/cancelled."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.status.in_(["pending", "confirmed", "preparing", "ready", "out_for_delivery"]))
        .order_by(Order.created_at.asc())
        .limit(100)
    )
    orders = result.scalars().all()
    columns = {
        "pending": [],
        "confirmed": [],
        "preparing": [],
        "ready": [],
        "out_for_delivery": [],
    }
    for o in orders:
        bucket = columns.get(o.status, columns["pending"])
        bucket.append(
            {
                "id": o.id,
                "order_number": o.order_number,
                "order_type": o.order_type,
                "status": o.status,
                "payment_status": o.payment_status,
                "guest_name": o.guest_name,
                "total_amount": float(o.total_amount),
                "special_instructions": o.special_instructions,
                "created_at": o.created_at,
                "items": [
                    {
                        "name": i.name,
                        "quantity": i.quantity,
                        "is_veg": i.is_veg,
                        "special_notes": i.special_notes,
                    }
                    for i in o.items
                ],
            }
        )
    return {"columns": columns, "count": len(orders)}


@router.get("/orders/{order_id}/timeline")
async def order_timeline(order_id: str, db: DbSession, _: StaffUser):
    order = (
        await db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
    ).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    steps = [
        ("pending", "Order placed", order.created_at),
        ("confirmed", "Confirmed", order.created_at if order.status != "pending" else None),
        ("preparing", "Kitchen preparing", None),
        ("ready", "Ready", None),
        ("out_for_delivery", "Out for delivery", None),
        ("delivered", "Delivered", order.delivered_at),
        ("cancelled", "Cancelled", order.cancelled_at),
    ]
    status_order = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]
    current_idx = status_order.index(order.status) if order.status in status_order else -1

    timeline = []
    for i, (code, label, ts) in enumerate(steps):
        if code == "cancelled" and order.status != "cancelled":
            continue
        if order.status == "cancelled" and code not in ("pending", "cancelled"):
            continue
        done = False
        if order.status == "cancelled":
            done = code in ("pending", "cancelled")
        elif code in status_order:
            done = status_order.index(code) <= current_idx
        timeline.append(
            {
                "code": code,
                "label": label,
                "done": done,
                "current": code == order.status,
                "at": ts,
            }
        )
    return {
        "order_number": order.order_number,
        "status": order.status,
        "payment_status": order.payment_status,
        "timeline": timeline,
        "items": [
            {"name": i.name, "qty": i.quantity, "line_total": float(i.line_total)}
            for i in order.items
        ],
        "totals": {
            "subtotal": float(order.subtotal),
            "discount": float(order.discount_amount),
            "gst": float(order.gst_amount),
            "delivery_fee": float(order.delivery_fee),
            "total": float(order.total_amount),
        },
        "special_instructions": order.special_instructions,
        "delivery_address": order.delivery_address,
    }


@router.get("/orders/{order_id}/invoice")
async def order_invoice_html(order_id: str, db: DbSession, _: StaffUser):
    import html as html_lib

    order = (
        await db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
    ).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    def esc(value) -> str:
        """HTML-escape any value that ends up inside the invoice markup.

        Several of these fields (guest_name, guest_phone, item names via
        special_notes) are free text supplied by whoever placed the order, so
        they must never be interpolated into HTML unescaped — doing so lets a
        customer's order data execute script in a staff member's browser the
        moment they open the invoice.
        """
        return html_lib.escape(str(value)) if value is not None else ""

    rows = "".join(
        f"<tr><td>{esc(i.quantity)}× {esc(i.name)}</td>"
        f"<td style='text-align:right'>₹{float(i.line_total):.2f}</td></tr>"
        for i in order.items
    )
    invoice_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Invoice {esc(order.invoice_number or order.order_number)}</title>
<style>
body{{font-family:system-ui,sans-serif;max-width:720px;margin:24px auto;color:#1a1a1a}}
h1{{color:#8B0000}} table{{width:100%;border-collapse:collapse;margin-top:16px}}
td,th{{padding:8px;border-bottom:1px solid #eee}} .muted{{color:#666;font-size:14px}}
@media print{{.no-print{{display:none}}}}
</style></head><body>
<button class="no-print" onclick="window.print()">Print</button>
<h1>Royal Rail Restro</h1>
<p class="muted">1st Floor, Dev Raj Tower, Gewalbigha, Gaya, Bihar</p>
<p><strong>Invoice:</strong> {esc(order.invoice_number or '—')}<br/>
<strong>Order:</strong> {esc(order.order_number)}<br/>
<strong>Date:</strong> {esc(order.created_at)}<br/>
<strong>Customer:</strong> {esc(order.guest_name or 'Guest')} · {esc(order.guest_phone or '')}</p>
<table><thead><tr><th align="left">Item</th><th align="right">Amount</th></tr></thead>
<tbody>{rows}</tbody></table>
<p style="text-align:right;margin-top:16px">
Subtotal: ₹{float(order.subtotal):.2f}<br/>
Discount: −₹{float(order.discount_amount):.2f}<br/>
GST: ₹{float(order.gst_amount):.2f}<br/>
Delivery: ₹{float(order.delivery_fee):.2f}<br/>
<strong style="font-size:18px;color:#8B0000">Total: ₹{float(order.total_amount):.2f}</strong>
</p>
<p class="muted">Payment: {esc(order.payment_method or '—')} · {esc(order.payment_status)}<br/>
Thank you for dining with Royal Rail Restro.</p>
</body></html>"""
    return Response(content=invoice_html, media_type="text/html")


@router.get("/export/orders.csv")
async def export_orders_csv(db: DbSession, user: AdminUser, request: Request):
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(2000)
    )
    orders = result.scalars().all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "order_number",
            "status",
            "order_type",
            "payment_status",
            "guest_name",
            "guest_phone",
            "subtotal",
            "discount",
            "gst",
            "total",
            "created_at",
        ]
    )
    for o in orders:
        w.writerow(
            [
                o.order_number,
                o.status,
                o.order_type,
                o.payment_status,
                o.guest_name,
                o.guest_phone,
                float(o.subtotal),
                float(o.discount_amount),
                float(o.gst_amount),
                float(o.total_amount),
                o.created_at,
            ]
        )
    await log_activity(
        db,
        action="export.orders_csv",
        user_id=user.id,
        entity_type="orders",
        ip_address=request.client.host if request.client else None,
    )
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@router.get("/export/reservations.csv")
async def export_reservations_csv(db: DbSession, user: AdminUser, request: Request):
    result = await db.execute(
        select(Reservation).order_by(Reservation.reservation_date.desc()).limit(2000)
    )
    rows = result.scalars().all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "reservation_number",
            "date",
            "time",
            "guest_name",
            "phone",
            "guest_count",
            "status",
            "table_number",
        ]
    )
    for r in rows:
        w.writerow(
            [
                r.reservation_number,
                r.reservation_date,
                r.reservation_time,
                r.guest_name,
                r.guest_phone,
                r.guest_count,
                r.status,
                r.table_number,
            ]
        )
    await log_activity(
        db,
        action="export.reservations_csv",
        user_id=user.id,
        entity_type="reservations",
        ip_address=request.client.host if request.client else None,
    )
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reservations.csv"},
    )


@router.get("/export/menu.csv")
async def export_menu_csv(db: DbSession, user: AdminUser):
    result = await db.execute(select(MenuItem).order_by(MenuItem.name))
    items = result.scalars().all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        ["id", "name", "slug", "price", "is_veg", "is_available", "is_featured", "category_id"]
    )
    for i in items:
        w.writerow(
            [
                i.id,
                i.name,
                i.slug,
                float(i.price),
                i.is_veg,
                i.is_available,
                i.is_featured,
                i.category_id,
            ]
        )
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=menu.csv"},
    )


@router.get("/backup/json")
async def backup_json(db: DbSession, user: AdminUser, request: Request):
    """Export core content as JSON backup (no password hashes)."""

    async def dump(model, exclude: set[str] | None = None):
        rows = (await db.execute(select(model))).scalars().all()
        out = []
        for r in rows:
            d = {}
            for col in r.__table__.columns:
                if exclude and col.name in exclude:
                    continue
                val = getattr(r, col.name)
                if hasattr(val, "isoformat"):
                    val = val.isoformat()
                elif hasattr(val, "__float__") and col.name in (
                    "price",
                    "subtotal",
                    "total_amount",
                    "discount_amount",
                    "gst_amount",
                    "delivery_fee",
                    "packing_fee",
                    "compare_at_price",
                    "discount_value",
                    "min_order_amount",
                    "max_discount",
                    "rating_avg",
                    "protein_g",
                    "carbs_g",
                    "fat_g",
                ):
                    try:
                        val = float(val)
                    except Exception:
                        pass
                d[col.name] = val
            out.append(d)
        return out

    payload = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": user.email,
        "categories": await dump(Category),
        "menu_items": await dump(MenuItem),
        "gallery": await dump(GalleryImage),
        "offers": await dump(Offer),
        "events": await dump(Event),
        "faqs": await dump(FAQ),
        "blog_posts": await dump(BlogPost),
        "reviews": await dump(Review),
        "coupons": await dump(Coupon),
        "site_settings": await dump(SiteSetting),
        "theme_settings": await dump(ThemeSetting),
        "feature_flags": await dump(FeatureFlag),
        "users": await dump(User, exclude={"password_hash", "refresh_token_jti"}),
    }
    await log_activity(
        db,
        action="backup.json",
        user_id=user.id,
        entity_type="system",
        ip_address=request.client.host if request.client else None,
    )
    body = json.dumps(payload, default=str, indent=2)
    return StreamingResponse(
        iter([body]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=rrr-backup-{date.today().isoformat()}.json"
        },
    )


@router.get("/reservations/calendar")
async def reservations_calendar(
    db: DbSession,
    _: StaffUser,
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
):
    """Month calendar: counts + list per day."""
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)

    result = await db.execute(
        select(Reservation)
        .where(
            Reservation.reservation_date >= start,
            Reservation.reservation_date < end,
        )
        .order_by(Reservation.reservation_date, Reservation.reservation_time)
    )
    rows = result.scalars().all()
    by_day: dict[str, list] = {}
    for r in rows:
        key = r.reservation_date.isoformat()
        by_day.setdefault(key, []).append(
            {
                "id": r.id,
                "reservation_number": r.reservation_number,
                "time": str(r.reservation_time)[:5],
                "guest_name": r.guest_name,
                "guest_count": r.guest_count,
                "status": r.status,
                "table_number": r.table_number,
                "phone": r.guest_phone,
            }
        )
    return {"year": year, "month": month, "days": by_day}


class TableAssign(BaseModel):
    table_number: str
    admin_notes: Optional[str] = None


@router.patch("/reservations/{reservation_id}/table")
async def assign_table(
    reservation_id: str,
    data: TableAssign,
    db: DbSession,
    user: StaffUser,
    request: Request,
):
    res = (
        await db.execute(select(Reservation).where(Reservation.id == reservation_id))
    ).scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    res.table_number = data.table_number
    if data.admin_notes is not None:
        res.admin_notes = data.admin_notes
    await db.flush()
    await log_activity(
        db,
        action="reservation.assign_table",
        user_id=user.id,
        entity_type="reservation",
        entity_id=reservation_id,
        details={"table": data.table_number},
        ip_address=request.client.host if request.client else None,
    )
    return {
        "id": res.id,
        "table_number": res.table_number,
        "status": res.status,
        "admin_notes": res.admin_notes,
    }


@router.get("/analytics/popular-dishes")
async def popular_dishes(db: DbSession, _: AdminUser, limit: int = Query(10, ge=1, le=50)):
    from app.models.order import OrderItem

    result = await db.execute(
        select(OrderItem.name, func.sum(OrderItem.quantity).label("qty"))
        .group_by(OrderItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    return [{"name": name, "quantity": int(qty or 0)} for name, qty in result.all()]


@router.get("/analytics/peak-hours")
async def peak_hours(db: DbSession, _: AdminUser):
    # Extract hour from created_at
    result = await db.execute(
        select(
            func.extract("hour", Order.created_at).label("hour"),
            func.count(Order.id),
        )
        .group_by(func.extract("hour", Order.created_at))
        .order_by(func.extract("hour", Order.created_at))
    )
    return [{"hour": int(h), "orders": int(c)} for h, c in result.all() if h is not None]
