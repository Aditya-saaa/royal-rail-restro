"""Content schemas: reviews, gallery, blog, events, offers, contact, FAQ."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ReviewCreate(BaseModel):
    menu_item_id: Optional[str] = None
    order_id: Optional[str] = None
    guest_name: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=200)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    menu_item_id: Optional[str] = None
    guest_name: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    is_approved: bool
    is_featured: bool
    admin_reply: Optional[str] = None
    created_at: Optional[datetime] = None


class GalleryImageCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    category: str = "general"
    alt_text: str = ""
    sort_order: int = 0
    is_featured: bool = False
    is_active: bool = True


class GalleryImageOut(GalleryImageCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: Optional[datetime] = None


class BlogPostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    tags: Optional[str] = None
    status: str = "draft"
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    is_featured: bool = False


class BlogPostOut(BlogPostCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author_id: Optional[str] = None
    published_at: Optional[datetime] = None
    views: int = 0
    created_at: Optional[datetime] = None


class EventCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    event_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: str = "Royal Rail Restro, Gaya"
    is_active: bool = True
    max_attendees: Optional[int] = None
    registration_required: bool = False


class EventOut(EventCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: Optional[datetime] = None


class OfferCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    discount_label: Optional[str] = None
    coupon_code: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True
    is_featured: bool = False
    terms: Optional[str] = None
    sort_order: int = 0


class OfferOut(OfferCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: Optional[datetime] = None


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = None
    subject: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=10, max_length=5000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    body: str
    status: str
    created_at: Optional[datetime] = None


class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str = "general"
    sort_order: int = 0
    is_active: bool = True


class FAQOut(FAQCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    body: str
    type: str
    link: Optional[str] = None
    is_read: bool
    channel: str
    created_at: Optional[datetime] = None
