"""Reservation endpoints."""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession, OptionalUser, StaffUser
from app.schemas.common import PaginatedResponse
from app.schemas.reservation import (
    ReservationCreate,
    ReservationOut,
    ReservationUpdate,
    TimeSlotOut,
)
from app.services.reservation_service import ReservationService
from app.utils.helpers import paginate

router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.get("/slots", response_model=List[TimeSlotOut])
async def time_slots(
    db: DbSession,
    for_date: date = Query(..., alias="date"),
):
    service = ReservationService(db)
    return await service.get_time_slots(for_date)


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    data: ReservationCreate, db: DbSession, user: OptionalUser
):
    service = ReservationService(db)
    try:
        return await service.create(data, user=user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/mine", response_model=PaginatedResponse[ReservationOut])
async def my_reservations(
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = ReservationService(db)
    items, total = await service.list_reservations(
        user_id=user.id, page=page, page_size=page_size
    )
    return paginate(items, total, page, page_size)


@router.get("/{reservation_id}", response_model=ReservationOut)
async def get_reservation(reservation_id: str, db: DbSession, user: CurrentUser):
    service = ReservationService(db)
    res = await service.get(reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if res.user_id != user.id and not user.is_superuser and not user.has_role("admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    return res


@router.get("", response_model=PaginatedResponse[ReservationOut])
async def list_reservations(
    db: DbSession,
    _: StaffUser,
    status_filter: Optional[str] = Query(None, alias="status"),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = ReservationService(db)
    items, total = await service.list_reservations(
        status=status_filter,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )
    return paginate(items, total, page, page_size)


@router.patch("/{reservation_id}", response_model=ReservationOut)
async def update_reservation(
    reservation_id: str,
    data: ReservationUpdate,
    db: DbSession,
    user: CurrentUser,
):
    service = ReservationService(db)
    res = await service.get(reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    is_staff = user.is_superuser or user.has_role("admin") or user.has_role("manager")
    if res.user_id != user.id and not is_staff:
        raise HTTPException(status_code=403, detail="Access denied")
    # Customers can only cancel
    if not is_staff and data.status and data.status != "cancelled":
        raise HTTPException(status_code=403, detail="Only cancellation allowed")
    return await service.update(res, data)
