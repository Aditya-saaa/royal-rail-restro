"""Public content endpoints: reviews, gallery, blog, events, offers, contact, FAQ."""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import AdminUser, CurrentUser, DbSession, OptionalUser, StaffUser
from app.models.content import Review
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.content import (
    BlogPostCreate,
    BlogPostOut,
    ContactMessageCreate,
    EventCreate,
    EventOut,
    FAQCreate,
    FAQOut,
    GalleryImageCreate,
    GalleryImageOut,
    MessageOut,
    NotificationOut,
    OfferCreate,
    OfferOut,
    ReviewCreate,
    ReviewOut,
)
from app.services.content_service import ContentService
from app.utils.helpers import paginate

router = APIRouter(tags=["Content"])


# ---- Reviews ----
@router.get("/reviews", response_model=PaginatedResponse[ReviewOut])
async def list_reviews(
    db: DbSession,
    featured_only: bool = False,
    menu_item_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = ContentService(db)
    items, total = await service.list_reviews(
        approved_only=True,
        featured_only=featured_only,
        menu_item_id=menu_item_id,
        page=page,
        page_size=page_size,
    )
    return paginate(items, total, page, page_size)


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(data: ReviewCreate, db: DbSession, user: OptionalUser):
    service = ContentService(db)
    return await service.create_review(data, user_id=user.id if user else None)


@router.patch("/reviews/{review_id}/approve", response_model=ReviewOut)
async def approve_review(
    review_id: str,
    db: DbSession,
    _: AdminUser,
    featured: bool = False,
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    service = ContentService(db)
    return await service.approve_review(review, featured=featured)


@router.patch("/reviews/{review_id}/reject", response_model=ReviewOut)
async def reject_review(review_id: str, db: DbSession, _: AdminUser):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_approved = False
    review.is_featured = False
    await db.flush()
    await db.refresh(review)
    return review


@router.patch("/reviews/{review_id}/reply", response_model=ReviewOut)
async def reply_review(review_id: str, db: DbSession, _: AdminUser, reply: str = ""):
    from datetime import datetime, timezone

    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.admin_reply = reply
    review.replied_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(review)
    return review


@router.delete("/reviews/{review_id}", response_model=MessageResponse)
async def delete_review(review_id: str, db: DbSession, _: AdminUser):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
    await db.flush()
    return MessageResponse(message="Review deleted")


@router.get("/reviews/admin", response_model=PaginatedResponse[ReviewOut])
async def list_reviews_admin(
    db: DbSession,
    _: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    approved_only: bool = False,
):
    service = ContentService(db)
    items, total = await service.list_reviews(
        approved_only=approved_only,
        page=page,
        page_size=page_size,
    )
    return paginate(items, total, page, page_size)


# ---- Gallery ----
@router.get("/gallery", response_model=List[GalleryImageOut])
async def list_gallery(
    db: DbSession,
    category: Optional[str] = None,
    featured_only: bool = False,
):
    service = ContentService(db)
    return await service.list_gallery(category=category, featured_only=featured_only)


@router.post("/gallery", response_model=GalleryImageOut, status_code=status.HTTP_201_CREATED)
async def create_gallery(data: GalleryImageCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_gallery(data)


# ---- Blog ----
@router.get("/blog", response_model=PaginatedResponse[BlogPostOut])
async def list_blogs(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    service = ContentService(db)
    items, total = await service.list_blogs(page=page, page_size=page_size)
    return paginate(items, total, page, page_size)


@router.get("/blog/{slug}", response_model=BlogPostOut)
async def get_blog(slug: str, db: DbSession):
    service = ContentService(db)
    post = await service.get_blog_by_slug(slug)
    if not post or post.status != "published":
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/blog", response_model=BlogPostOut, status_code=status.HTTP_201_CREATED)
async def create_blog(data: BlogPostCreate, db: DbSession, user: AdminUser):
    service = ContentService(db)
    return await service.create_blog(data, author_id=user.id)


# ---- Events ----
@router.get("/events", response_model=List[EventOut])
async def list_events(db: DbSession, upcoming_only: bool = True):
    service = ContentService(db)
    return await service.list_events(upcoming_only=upcoming_only)


@router.post("/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(data: EventCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_event(data)


# ---- Offers ----
@router.get("/offers", response_model=List[OfferOut])
async def list_offers(db: DbSession):
    service = ContentService(db)
    return await service.list_offers()


@router.post("/offers", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(data: OfferCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_offer(data)


# ---- Contact ----
@router.post("/contact", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def contact(data: ContactMessageCreate, db: DbSession):
    service = ContentService(db)
    return await service.create_message(data)


@router.get("/contact/messages", response_model=PaginatedResponse[MessageOut])
async def list_messages(
    db: DbSession,
    _: StaffUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = ContentService(db)
    items, total = await service.list_messages(page=page, page_size=page_size)
    return paginate(items, total, page, page_size)


# ---- FAQ ----
@router.get("/faqs", response_model=List[FAQOut])
async def list_faqs(db: DbSession, category: Optional[str] = None):
    service = ContentService(db)
    return await service.list_faqs(category=category)


@router.post("/faqs", response_model=FAQOut, status_code=status.HTTP_201_CREATED)
async def create_faq(data: FAQCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_faq(data)


# ---- Notifications ----
@router.get("/notifications", response_model=List[NotificationOut])
async def my_notifications(
    db: DbSession,
    user: CurrentUser,
    unread_only: bool = False,
):
    service = ContentService(db)
    return await service.list_notifications(user.id, unread_only=unread_only)
