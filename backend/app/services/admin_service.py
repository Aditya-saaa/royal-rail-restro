"""Admin analytics and dashboard stats."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Message, Review
from app.models.order import Order
from app.models.reservation import Reservation
from app.models.user import User


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def dashboard_stats(self) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        # Orders
        total_orders = (
            await self.db.execute(select(func.count()).select_from(Order))
        ).scalar() or 0
        today_orders = (
            await self.db.execute(
                select(func.count()).select_from(Order).where(Order.created_at >= today_start)
            )
        ).scalar() or 0
        revenue = (
            await self.db.execute(
                select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                    Order.status.notin_(["cancelled"])
                )
            )
        ).scalar() or Decimal("0")
        month_revenue = (
            await self.db.execute(
                select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                    Order.created_at >= month_ago,
                    Order.status.notin_(["cancelled"]),
                )
            )
        ).scalar() or Decimal("0")

        # Customers
        total_users = (
            await self.db.execute(select(func.count()).select_from(User))
        ).scalar() or 0
        new_users_week = (
            await self.db.execute(
                select(func.count()).select_from(User).where(User.created_at >= week_ago)
            )
        ).scalar() or 0

        # Reservations
        pending_reservations = (
            await self.db.execute(
                select(func.count())
                .select_from(Reservation)
                .where(Reservation.status == "pending")
            )
        ).scalar() or 0
        today_reservations = (
            await self.db.execute(
                select(func.count())
                .select_from(Reservation)
                .where(Reservation.reservation_date == now.date())
            )
        ).scalar() or 0

        # Reviews & messages
        pending_reviews = (
            await self.db.execute(
                select(func.count())
                .select_from(Review)
                .where(Review.is_approved.is_(False))
            )
        ).scalar() or 0
        new_messages = (
            await self.db.execute(
                select(func.count()).select_from(Message).where(Message.status == "new")
            )
        ).scalar() or 0

        # Order status breakdown
        status_rows = (
            await self.db.execute(
                select(Order.status, func.count()).group_by(Order.status)
            )
        ).all()
        orders_by_status = {row[0]: row[1] for row in status_rows}

        # Revenue last 7 days
        revenue_series = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            day_start = datetime.combine(day, datetime.min.time()).replace(
                tzinfo=timezone.utc
            )
            day_end = day_start + timedelta(days=1)
            day_rev = (
                await self.db.execute(
                    select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                        Order.created_at >= day_start,
                        Order.created_at < day_end,
                        Order.status.notin_(["cancelled"]),
                    )
                )
            ).scalar() or 0
            revenue_series.append({"date": day.isoformat(), "revenue": float(day_rev)})

        return {
            "total_orders": total_orders,
            "today_orders": today_orders,
            "total_revenue": float(revenue),
            "month_revenue": float(month_revenue),
            "total_users": total_users,
            "new_users_week": new_users_week,
            "pending_reservations": pending_reservations,
            "today_reservations": today_reservations,
            "pending_reviews": pending_reviews,
            "new_messages": new_messages,
            "orders_by_status": orders_by_status,
            "revenue_series": revenue_series,
        }
