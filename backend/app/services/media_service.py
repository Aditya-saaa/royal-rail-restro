"""Cloudinary media service with local/dev fallbacks."""

from __future__ import annotations

import io
import uuid
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.settings import MediaAsset


class MediaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _cloudinary_ready(self) -> bool:
        return bool(
            settings.cloudinary_cloud_name
            and settings.cloudinary_api_key
            and settings.cloudinary_api_secret
        )

    def _configure_cloudinary(self) -> None:
        import cloudinary

        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )

    async def list_media(
        self,
        *,
        folder: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 24,
    ) -> tuple[list[MediaAsset], int]:
        q = select(MediaAsset)
        count_q = select(func.count()).select_from(MediaAsset)
        if folder:
            q = q.where(MediaAsset.folder == folder)
            count_q = count_q.where(MediaAsset.folder == folder)
        if search:
            term = f"%{search}%"
            q = q.where(
                MediaAsset.original_name.ilike(term)
                | MediaAsset.filename.ilike(term)
                | MediaAsset.alt_text.ilike(term)
            )
            count_q = count_q.where(
                MediaAsset.original_name.ilike(term)
                | MediaAsset.filename.ilike(term)
            )
        total = (await self.db.execute(count_q)).scalar() or 0
        q = (
            q.order_by(MediaAsset.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = (await self.db.execute(q)).scalars().all()
        return list(rows), total

    async def upload(
        self,
        *,
        file_bytes: bytes,
        filename: str,
        folder: str = "royal-rail-restro",
        alt_text: str = "",
        uploaded_by: Optional[str] = None,
        content_type: str = "image/jpeg",
    ) -> MediaAsset:
        public_id = f"{folder}/{uuid.uuid4().hex}"
        url = ""
        secure_url = ""
        width = None
        height = None
        fmt = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
        bytes_len = len(file_bytes)
        resource_type = "image"

        if self._cloudinary_ready():
            self._configure_cloudinary()
            import cloudinary.uploader

            result = cloudinary.uploader.upload(
                io.BytesIO(file_bytes),
                public_id=public_id,
                folder=folder,
                resource_type="auto",
                overwrite=False,
                transformation=[
                    {"quality": "auto", "fetch_format": "auto"},
                ],
            )
            url = result.get("url") or result.get("secure_url") or ""
            secure_url = result.get("secure_url") or url
            width = result.get("width")
            height = result.get("height")
            fmt = result.get("format") or fmt
            bytes_len = result.get("bytes") or bytes_len
            public_id = result.get("public_id") or public_id
            resource_type = result.get("resource_type") or "image"
        else:
            # Dev fallback: data URI not stored; use placeholder with name
            safe = filename.replace(" ", "-")[:40]
            url = f"https://placehold.co/800x600/8B0000/D4AF37?text={safe}"
            secure_url = url

        asset = MediaAsset(
            filename=public_id.split("/")[-1],
            original_name=filename,
            url=url,
            secure_url=secure_url,
            public_id=public_id,
            resource_type=resource_type,
            format=fmt,
            width=width,
            height=height,
            bytes=bytes_len,
            folder=folder,
            alt_text=alt_text or filename,
            uploaded_by=uploaded_by,
        )
        self.db.add(asset)
        await self.db.flush()
        await self.db.refresh(asset)
        return asset

    async def delete(self, asset_id: str) -> None:
        asset = (
            await self.db.execute(select(MediaAsset).where(MediaAsset.id == asset_id))
        ).scalar_one_or_none()
        if not asset:
            raise ValueError("Media not found")
        if asset.public_id and self._cloudinary_ready():
            try:
                self._configure_cloudinary()
                import cloudinary.uploader

                cloudinary.uploader.destroy(asset.public_id, resource_type=asset.resource_type or "image")
            except Exception:
                pass
        await self.db.delete(asset)
        await self.db.flush()

    async def update_meta(
        self, asset_id: str, *, alt_text: Optional[str] = None, folder: Optional[str] = None
    ) -> MediaAsset:
        asset = (
            await self.db.execute(select(MediaAsset).where(MediaAsset.id == asset_id))
        ).scalar_one_or_none()
        if not asset:
            raise ValueError("Media not found")
        if alt_text is not None:
            asset.alt_text = alt_text
        if folder is not None:
            asset.folder = folder
        await self.db.flush()
        await self.db.refresh(asset)
        return asset

    @staticmethod
    def transform_url(url: str, *, width: int = 400, crop: str = "fill") -> str:
        """Best-effort Cloudinary transform URL for responsive images."""
        if "res.cloudinary.com" not in (url or ""):
            return url
        # Insert transformation after /upload/
        if "/upload/" in url:
            return url.replace("/upload/", f"/upload/c_{crop},w_{width},f_auto,q_auto/")
        return url
