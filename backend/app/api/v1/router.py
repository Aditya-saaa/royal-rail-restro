"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, content, menu, orders, public, reservations

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(menu.router)
api_router.include_router(orders.router)
api_router.include_router(reservations.router)
api_router.include_router(content.router)
api_router.include_router(admin.router)
api_router.include_router(public.router)
