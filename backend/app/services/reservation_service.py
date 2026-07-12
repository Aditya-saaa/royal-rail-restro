"""Reservation service."""

from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional, Sequence, Tuple

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationUpdate, TimeSlotOut
from app.utils.helpers import apply_updates, generate_reservation_number

# Capacity assumptions for time slots
MAX_GUESTS_PER_SLOT = 40
SLOT_TIMES = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
]


class ReservationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, data: ReservationCreate, user: Optional[User] = None
    ) -> Reservation:
        # Check capacity for slot
        slots = await self.get_time_slots(data.reservation_date)
        time_str = data.reservation_time.strftime("%H:%M")
        slot = next((s for s in slots if s.time == time_str), None)
        if slot and not slot.available:
            raise ValueError("Selected time slot is fully booked")
        if slot and data.guest_count > slot.remaining_capacity:
            raise ValueError(
                f"Only {slot.remaining_capacity} seats remaining for this slot"
            )

        res = Reservation(
            reservation_number=generate_reservation_number(),
            user_id=user.id if user else None,
            guest_name=data.guest_name,
            guest_email=data.guest_email,
            guest_phone=data.guest_phone,
            reservation_date=data.reservation_date,
            reservation_time=data.reservation_time,
            guest_count=data.guest_count,
            special_requests=data.special_requests,
            occasion=data.occasion,
            status="pending",
        )
        self.db.add(res)
        await self.db.flush()
        await self.db.refresh(res)
        return res

    async def get(self, reservation_id: str) -> Optional[Reservation]:
        result = await self.db.execute(
            select(Reservation).where(Reservation.id == reservation_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, number: str) -> Optional[Reservation]:
        result = await self.db.execute(
            select(Reservation).where(Reservation.reservation_number == number)
        )
        return result.scalar_one_or_none()

    async def list_reservations(
        self,
        *,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[Sequence[Reservation], int]:
        q = select(Reservation)
        count_q = select(func.count()).select_from(Reservation)
        if user_id:
            q = q.where(Reservation.user_id == user_id)
            count_q = count_q.where(Reservation.user_id == user_id)
        if status:
            q = q.where(Reservation.status == status)
            count_q = count_q.where(Reservation.status == status)
        if from_date:
            q = q.where(Reservation.reservation_date >= from_date)
            count_q = count_q.where(Reservation.reservation_date >= from_date)
        if to_date:
            q = q.where(Reservation.reservation_date <= to_date)
            count_q = count_q.where(Reservation.reservation_date <= to_date)
        total = (await self.db.execute(count_q)).scalar() or 0
        q = (
            q.order_by(Reservation.reservation_date.desc(), Reservation.reservation_time)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(q)
        return result.scalars().all(), total

    async def update(self, res: Reservation, data: ReservationUpdate) -> Reservation:
        payload = data.model_dump(exclude_unset=True)
        if payload.get("status") == "confirmed" and res.status != "confirmed":
            res.confirmed_at = datetime.now(timezone.utc)
        if payload.get("status") == "cancelled":
            res.cancelled_at = datetime.now(timezone.utc)
        apply_updates(res, payload)
        await self.db.flush()
        await self.db.refresh(res)
        return res

    async def get_time_slots(self, for_date: date) -> List[TimeSlotOut]:
        result = await self.db.execute(
            select(
                Reservation.reservation_time,
                func.coalesce(func.sum(Reservation.guest_count), 0),
            )
            .where(
                and_(
                    Reservation.reservation_date == for_date,
                    Reservation.status.in_(["pending", "confirmed", "seated"]),
                )
            )
            .group_by(Reservation.reservation_time)
        )
        booked = {row[0].strftime("%H:%M"): int(row[1]) for row in result.all()}

        slots: List[TimeSlotOut] = []
        now = datetime.now()
        for t in SLOT_TIMES:
            used = booked.get(t, 0)
            remaining = max(0, MAX_GUESTS_PER_SLOT - used)
            available = remaining > 0
            # Disable past slots for today
            if for_date == date.today():
                hour, minute = map(int, t.split(":"))
                slot_dt = datetime.combine(for_date, time(hour, minute))
                if slot_dt < now + timedelta(minutes=30):
                    available = False
                    remaining = 0
            slots.append(
                TimeSlotOut(time=t, available=available, remaining_capacity=remaining)
            )
        return slots
