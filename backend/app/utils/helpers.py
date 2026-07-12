"""Shared helpers: slugify, order numbers, pagination."""

import re
import secrets
import string
from datetime import datetime, timezone
from math import ceil
from typing import Any, Sequence, TypeVar
from unicodedata import normalize

from app.schemas.common import PaginatedResponse, PaginationMeta

T = TypeVar("T")


def slugify(text: str, max_length: int = 180) -> str:
    text = normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:max_length]


def generate_order_number() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = "".join(secrets.choice(string.digits) for _ in range(6))
    return f"RRR-{ts}-{suffix}"


def generate_reservation_number() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(5))
    return f"RSV-{ts}-{suffix}"


def generate_invoice_number() -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m")
    suffix = "".join(secrets.choice(string.digits) for _ in range(6))
    return f"INV-{ts}-{suffix}"


def generate_referral_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def paginate(
    items: Sequence[T],
    total: int,
    page: int,
    page_size: int,
) -> PaginatedResponse[Any]:
    total_pages = max(1, ceil(total / page_size)) if page_size else 1
    return PaginatedResponse(
        items=list(items),
        meta=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    )


def apply_updates(obj: Any, data: dict[str, Any]) -> Any:
    for key, value in data.items():
        if value is not None and hasattr(obj, key):
            setattr(obj, key, value)
    return obj
