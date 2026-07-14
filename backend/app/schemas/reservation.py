"""Reservation schemas."""

from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ReservationCreate(BaseModel):
    guest_name: str = Field(min_length=2, max_length=150)
    guest_email: EmailStr
    guest_phone: str = Field(min_length=10, max_length=20)
    reservation_date: date
    reservation_time: time
    guest_count: int = Field(ge=1, le=50)
    special_requests: Optional[str] = Field(default=None, max_length=500)
    occasion: Optional[str] = Field(default=None, max_length=100)

    @field_validator("reservation_date")
    @classmethod
    def date_not_past(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("Reservation date cannot be in the past")
        return v


class ReservationUpdate(BaseModel):
    reservation_date: Optional[date] = None
    reservation_time: Optional[time] = None
    guest_count: Optional[int] = Field(default=None, ge=1, le=50)
    special_requests: Optional[str] = Field(default=None, max_length=500)
    occasion: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = None
    table_number: Optional[str] = Field(default=None, max_length=20)
    admin_notes: Optional[str] = Field(default=None, max_length=1000)
    cancel_reason: Optional[str] = Field(default=None, max_length=300)


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reservation_number: str
    user_id: Optional[str] = None
    guest_name: str
    guest_email: str
    guest_phone: str
    reservation_date: date
    reservation_time: time
    guest_count: int
    special_requests: Optional[str] = None
    occasion: Optional[str] = None
    status: str
    table_number: Optional[str] = None
    admin_notes: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class TimeSlotOut(BaseModel):
    time: str
    available: bool
    remaining_capacity: int
