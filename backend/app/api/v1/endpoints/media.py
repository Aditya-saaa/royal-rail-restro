"""Media library endpoints."""

from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status

from app.api.deps import AdminUser, CurrentUser, DbSession
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.media_service import MediaService
from app.utils.helpers import paginate

router = APIRouter(prefix="/media", tags=["Media"])


def _asset_out(a) -> dict:
    return {
        "id": a.id,
        "filename": a.filename,
        "original_name": a.original_name,
        "url": a.secure_url or a.url,
        "secure_url": a.secure_url,
        "public_id": a.public_id,
        "resource_type": a.resource_type,
        "format": a.format,
        "width": a.width,
        "height": a.height,
        "bytes": a.bytes,
        "folder": a.folder,
        "alt_text": a.alt_text,
        "created_at": a.created_at,
        "thumbnail": MediaService.transform_url(a.secure_url or a.url or "", width=200)
        if a.url
        else None,
        "responsive": {
            "sm": MediaService.transform_url(a.secure_url or a.url or "", width=400),
            "md": MediaService.transform_url(a.secure_url or a.url or "", width=800),
            "lg": MediaService.transform_url(a.secure_url or a.url or "", width=1200),
        }
        if a.url
        else None,
    }


@router.get("")
async def list_media(
    db: DbSession,
    _: AdminUser,
    folder: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
):
    service = MediaService(db)
    items, total = await service.list_media(
        folder=folder, search=search, page=page, page_size=page_size
    )
    return paginate([_asset_out(i) for i in items], total, page, page_size)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_media(
    db: DbSession,
    user: CurrentUser,
    _: AdminUser,
    file: UploadFile = File(...),
    folder: str = Form("royal-rail-restro"),
    alt_text: str = Form(""),
):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 12MB)")
    service = MediaService(db)
    try:
        asset = await service.upload(
            file_bytes=data,
            filename=file.filename or "upload.jpg",
            folder=folder,
            alt_text=alt_text,
            uploaded_by=user.id,
            content_type=file.content_type or "image/jpeg",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc
    return _asset_out(asset)


@router.delete("/{asset_id}", response_model=MessageResponse)
async def delete_media(asset_id: str, db: DbSession, _: AdminUser):
    service = MediaService(db)
    try:
        await service.delete(asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return MessageResponse(message="Media deleted")


@router.patch("/{asset_id}")
async def update_media(
    asset_id: str,
    db: DbSession,
    _: AdminUser,
    alt_text: Optional[str] = None,
    folder: Optional[str] = None,
):
    service = MediaService(db)
    try:
        asset = await service.update_meta(asset_id, alt_text=alt_text, folder=folder)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _asset_out(asset)
