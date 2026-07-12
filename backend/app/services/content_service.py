"""Content services: reviews, gallery, blogs, events, offers, contact, FAQ."""

from datetime import datetime, timezone
from typing import Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import (
    BlogPost,
    Event,
    FAQ,
    GalleryImage,
    Message,
    Notification,
    Offer,
    Review,
)
from app.models.menu import MenuItem
from app.schemas.content import (
    BlogPostCreate,
    ContactMessageCreate,
    EventCreate,
    FAQCreate,
    GalleryImageCreate,
    OfferCreate,
    ReviewCreate,
)
from app.utils.helpers import apply_updates, slugify


class ContentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Reviews
    async def create_review(
        self, data: ReviewCreate, user_id: Optional[str] = None
    ) -> Review:
        review = Review(
            user_id=user_id,
            menu_item_id=data.menu_item_id,
            order_id=data.order_id,
            guest_name=data.guest_name,
            rating=data.rating,
            title=data.title,
            comment=data.comment,
            is_approved=False,
        )
        self.db.add(review)
        await self.db.flush()
        await self.db.refresh(review)
        return review

    async def list_reviews(
        self,
        *,
        approved_only: bool = True,
        featured_only: bool = False,
        menu_item_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[Sequence[Review], int]:
        q = select(Review)
        count_q = select(func.count()).select_from(Review)
        if approved_only:
            q = q.where(Review.is_approved.is_(True))
            count_q = count_q.where(Review.is_approved.is_(True))
        if featured_only:
            q = q.where(Review.is_featured.is_(True))
            count_q = count_q.where(Review.is_featured.is_(True))
        if menu_item_id:
            q = q.where(Review.menu_item_id == menu_item_id)
            count_q = count_q.where(Review.menu_item_id == menu_item_id)
        total = (await self.db.execute(count_q)).scalar() or 0
        q = q.order_by(Review.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        return (await self.db.execute(q)).scalars().all(), total

    async def approve_review(self, review: Review, featured: bool = False) -> Review:
        review.is_approved = True
        review.is_featured = featured
        if review.menu_item_id:
            await self._recalc_item_rating(review.menu_item_id)
        await self.db.flush()
        return review

    async def _recalc_item_rating(self, menu_item_id: str) -> None:
        result = await self.db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.menu_item_id == menu_item_id, Review.is_approved.is_(True)
            )
        )
        avg, count = result.one()
        item_result = await self.db.execute(
            select(MenuItem).where(MenuItem.id == menu_item_id)
        )
        item = item_result.scalar_one_or_none()
        if item:
            item.rating_avg = round(float(avg or 0), 2)
            item.rating_count = int(count or 0)

    # Gallery
    async def list_gallery(
        self, category: Optional[str] = None, featured_only: bool = False
    ) -> Sequence[GalleryImage]:
        q = select(GalleryImage).where(GalleryImage.is_active.is_(True))
        if category:
            q = q.where(GalleryImage.category == category)
        if featured_only:
            q = q.where(GalleryImage.is_featured.is_(True))
        q = q.order_by(GalleryImage.sort_order, GalleryImage.created_at.desc())
        return (await self.db.execute(q)).scalars().all()

    async def create_gallery(self, data: GalleryImageCreate) -> GalleryImage:
        img = GalleryImage(**data.model_dump())
        self.db.add(img)
        await self.db.flush()
        await self.db.refresh(img)
        return img

    # Blog
    async def list_blogs(
        self, published_only: bool = True, page: int = 1, page_size: int = 10
    ) -> Tuple[Sequence[BlogPost], int]:
        q = select(BlogPost)
        count_q = select(func.count()).select_from(BlogPost)
        if published_only:
            q = q.where(BlogPost.status == "published")
            count_q = count_q.where(BlogPost.status == "published")
        total = (await self.db.execute(count_q)).scalar() or 0
        q = q.order_by(BlogPost.published_at.desc().nullslast()).offset(
            (page - 1) * page_size
        ).limit(page_size)
        return (await self.db.execute(q)).scalars().all(), total

    async def get_blog_by_slug(self, slug: str) -> Optional[BlogPost]:
        result = await self.db.execute(select(BlogPost).where(BlogPost.slug == slug))
        post = result.scalar_one_or_none()
        if post:
            post.views = (post.views or 0) + 1
            await self.db.flush()
        return post

    async def create_blog(self, data: BlogPostCreate, author_id: Optional[str]) -> BlogPost:
        slug = data.slug or slugify(data.title)
        post = BlogPost(**data.model_dump(exclude={"slug"}), slug=slug, author_id=author_id)
        if data.status == "published":
            post.published_at = datetime.now(timezone.utc)
        self.db.add(post)
        await self.db.flush()
        await self.db.refresh(post)
        return post

    # Events
    async def list_events(self, upcoming_only: bool = True) -> Sequence[Event]:
        q = select(Event).where(Event.is_active.is_(True))
        if upcoming_only:
            q = q.where(Event.event_date >= datetime.now(timezone.utc).date())
        q = q.order_by(Event.event_date)
        return (await self.db.execute(q)).scalars().all()

    async def create_event(self, data: EventCreate) -> Event:
        slug = data.slug or slugify(data.title)
        event = Event(**data.model_dump(exclude={"slug"}), slug=slug)
        self.db.add(event)
        await self.db.flush()
        await self.db.refresh(event)
        return event

    # Offers
    async def list_offers(self, active_only: bool = True) -> Sequence[Offer]:
        q = select(Offer)
        if active_only:
            q = q.where(Offer.is_active.is_(True))
        q = q.order_by(Offer.sort_order, Offer.created_at.desc())
        return (await self.db.execute(q)).scalars().all()

    async def create_offer(self, data: OfferCreate) -> Offer:
        slug = data.slug or slugify(data.title)
        offer = Offer(**data.model_dump(exclude={"slug"}), slug=slug)
        self.db.add(offer)
        await self.db.flush()
        await self.db.refresh(offer)
        return offer

    # Contact
    async def create_message(self, data: ContactMessageCreate) -> Message:
        msg = Message(**data.model_dump(), status="new")
        self.db.add(msg)
        await self.db.flush()
        await self.db.refresh(msg)
        return msg

    async def list_messages(
        self, page: int = 1, page_size: int = 20
    ) -> Tuple[Sequence[Message], int]:
        count_q = select(func.count()).select_from(Message)
        total = (await self.db.execute(count_q)).scalar() or 0
        q = (
            select(Message)
            .order_by(Message.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return (await self.db.execute(q)).scalars().all(), total

    # FAQ
    async def list_faqs(self, category: Optional[str] = None) -> Sequence[FAQ]:
        q = select(FAQ).where(FAQ.is_active.is_(True))
        if category:
            q = q.where(FAQ.category == category)
        q = q.order_by(FAQ.sort_order)
        return (await self.db.execute(q)).scalars().all()

    async def create_faq(self, data: FAQCreate) -> FAQ:
        faq = FAQ(**data.model_dump())
        self.db.add(faq)
        await self.db.flush()
        await self.db.refresh(faq)
        return faq

    # Notifications
    async def list_notifications(
        self, user_id: str, unread_only: bool = False
    ) -> Sequence[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read.is_(False))
        q = q.order_by(Notification.created_at.desc()).limit(50)
        return (await self.db.execute(q)).scalars().all()

    async def mark_notification_read(self, notif: Notification) -> Notification:
        notif.is_read = True
        await self.db.flush()
        return notif
