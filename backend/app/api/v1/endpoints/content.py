"""Public content endpoints: reviews, gallery, blog, events, offers, contact, FAQ."""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

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
logger = logging.getLogger(__name__)


async def _resilient(label: str, coro, default):
    """Run a public read query; on a transient DB error, log it and return an
    empty/default result instead of letting the request 500. Used only for
    public GET endpoints — write endpoints and admin views still surface real
    errors so they can be acted on.
    """
    try:
        return await coro
    except (DBAPIError, SQLAlchemyError) as exc:
        logger.error("%s: query failed, returning empty result: %s", label, exc)
        return default


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
    items, total = await _resilient(
        "list_reviews",
        service.list_reviews(
            approved_only=True,
            featured_only=featured_only,
            menu_item_id=menu_item_id,
            page=page,
            page_size=page_size,
        ),
        ([], 0),
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
    from app.services.feature_service import FeatureService

    if not await FeatureService(db).is_enabled("gallery"):
        raise HTTPException(
            status_code=503,
            detail="Gallery is currently unavailable.",
        )
    service = ContentService(db)
    return await _resilient(
        "list_gallery", service.list_gallery(category=category, featured_only=featured_only), []
    )


@router.post("/gallery", response_model=GalleryImageOut, status_code=status.HTTP_201_CREATED)
async def create_gallery(data: GalleryImageCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_gallery(data)


@router.get("/gallery/admin", response_model=List[GalleryImageOut])
async def list_gallery_admin(db: DbSession, _: AdminUser):
    """All gallery images including inactive (admin)."""
    from app.models.content import GalleryImage as GalleryImageModel

    result = await db.execute(
        select(GalleryImageModel).order_by(
            GalleryImageModel.sort_order, GalleryImageModel.created_at.desc()
        )
    )
    return result.scalars().all()


@router.patch("/gallery/{image_id}", response_model=GalleryImageOut)
async def update_gallery(image_id: str, data: dict, db: DbSession, _: AdminUser):
    service = ContentService(db)
    img = await service.get_gallery(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    allowed = {
        "title",
        "description",
        "image_url",
        "thumbnail_url",
        "category",
        "alt_text",
        "sort_order",
        "is_featured",
        "is_active",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    return await service.update_gallery(img, payload)


@router.delete("/gallery/{image_id}", response_model=MessageResponse)
async def delete_gallery(image_id: str, db: DbSession, _: AdminUser):
    service = ContentService(db)
    img = await service.get_gallery(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    await service.delete_gallery(img)
    return MessageResponse(message="Gallery image deleted")


# ---- Blog ----
@router.get("/blog", response_model=PaginatedResponse[BlogPostOut])
async def list_blogs(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    from app.services.feature_service import FeatureService

    if not await FeatureService(db).is_enabled("blog"):
        raise HTTPException(status_code=503, detail="Blog is currently unavailable.")
    service = ContentService(db)
    items, total = await _resilient(
        "list_blogs", service.list_blogs(page=page, page_size=page_size), ([], 0)
    )
    return paginate(items, total, page, page_size)


@router.get("/blog/admin/list", response_model=PaginatedResponse[BlogPostOut])
async def list_blogs_admin(
    db: DbSession,
    _: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = ContentService(db)
    items, total = await service.list_blogs_admin(page=page, page_size=page_size)
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


@router.patch("/blog/id/{post_id}", response_model=BlogPostOut)
async def update_blog(post_id: str, data: dict, db: DbSession, _: AdminUser):
    service = ContentService(db)
    post = await service.get_blog(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    allowed = {
        "title",
        "slug",
        "excerpt",
        "content",
        "cover_image",
        "tags",
        "status",
        "meta_title",
        "meta_description",
        "is_featured",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    return await service.update_blog(post, payload)


@router.delete("/blog/id/{post_id}", response_model=MessageResponse)
async def delete_blog(post_id: str, db: DbSession, _: AdminUser):
    service = ContentService(db)
    post = await service.get_blog(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await service.delete_blog(post)
    return MessageResponse(message="Blog post deleted")


# ---- Events ----
@router.get("/events", response_model=List[EventOut])
async def list_events(db: DbSession, upcoming_only: bool = True):
    from app.services.feature_service import FeatureService

    if not await FeatureService(db).is_enabled("events"):
        raise HTTPException(status_code=503, detail="Events are currently unavailable.")
    service = ContentService(db)
    return await _resilient("list_events", service.list_events(upcoming_only=upcoming_only), [])


@router.get("/events/admin", response_model=List[EventOut])
async def list_events_admin(db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.list_events(upcoming_only=False)


@router.post("/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(data: EventCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_event(data)


@router.patch("/events/{event_id}", response_model=EventOut)
async def update_event(event_id: str, data: dict, db: DbSession, _: AdminUser):
    service = ContentService(db)
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    allowed = {
        "title",
        "slug",
        "description",
        "image_url",
        "event_date",
        "start_time",
        "end_time",
        "location",
        "is_active",
        "max_attendees",
        "registration_required",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    return await service.update_event(event, payload)


@router.delete("/events/{event_id}", response_model=MessageResponse)
async def delete_event(event_id: str, db: DbSession, _: AdminUser):
    service = ContentService(db)
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await service.delete_event(event)
    return MessageResponse(message="Event deleted")


# ---- Offers ----
@router.get("/offers", response_model=List[OfferOut])
async def list_offers(db: DbSession):
    from app.services.feature_service import FeatureService

    fs = FeatureService(db)
    # Accept either offers or home_offers module keys
    if not await fs.is_enabled("offers") and not await fs.is_enabled("home_offers"):
        raise HTTPException(status_code=503, detail="Offers are currently unavailable.")
    service = ContentService(db)
    return await _resilient("list_offers", service.list_offers(), [])


@router.get("/offers/admin", response_model=List[OfferOut])
async def list_offers_admin(db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.list_offers(active_only=False)


@router.post("/offers", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(data: OfferCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_offer(data)


@router.patch("/offers/{offer_id}", response_model=OfferOut)
async def update_offer(offer_id: str, data: dict, db: DbSession, _: AdminUser):
    service = ContentService(db)
    offer = await service.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    allowed = {
        "title",
        "slug",
        "description",
        "image_url",
        "discount_label",
        "coupon_code",
        "starts_at",
        "ends_at",
        "is_active",
        "is_featured",
        "terms",
        "sort_order",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    return await service.update_offer(offer, payload)


@router.delete("/offers/{offer_id}", response_model=MessageResponse)
async def delete_offer(offer_id: str, db: DbSession, _: AdminUser):
    service = ContentService(db)
    offer = await service.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    await service.delete_offer(offer)
    return MessageResponse(message="Offer deleted")


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
    return await _resilient("list_faqs", service.list_faqs(category=category), [])


@router.post("/faqs", response_model=FAQOut, status_code=status.HTTP_201_CREATED)
async def create_faq(data: FAQCreate, db: DbSession, _: AdminUser):
    service = ContentService(db)
    return await service.create_faq(data)


@router.patch("/faqs/{faq_id}", response_model=FAQOut)
async def update_faq(faq_id: str, data: dict, db: DbSession, _: AdminUser):
    service = ContentService(db)
    faq = await service.get_faq(faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    allowed = {"question", "answer", "category", "sort_order", "is_active"}
    payload = {k: v for k, v in data.items() if k in allowed}
    return await service.update_faq(faq, payload)


@router.delete("/faqs/{faq_id}", response_model=MessageResponse)
async def delete_faq(faq_id: str, db: DbSession, _: AdminUser):
    service = ContentService(db)
    faq = await service.get_faq(faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await service.delete_faq(faq)
    return MessageResponse(message="FAQ deleted")


# ---- Notifications ----
@router.get("/notifications", response_model=List[NotificationOut])
async def my_notifications(
    db: DbSession,
    user: CurrentUser,
    unread_only: bool = False,
):
    service = ContentService(db)
    return await service.list_notifications(user.id, unread_only=unread_only)
