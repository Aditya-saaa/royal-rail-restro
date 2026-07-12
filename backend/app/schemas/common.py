"""Shared response and pagination schemas."""

from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    success: bool = False
    code: Optional[str] = None


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    meta: PaginationMeta


class TimestampSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class IDSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    database: str
    redis: str
    cloudinary: str
    timestamp: datetime


class StatsCard(BaseModel):
    label: str
    value: Any
    change: Optional[float] = None
    change_label: Optional[str] = None
