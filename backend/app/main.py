"""Royal Rail Restro — FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

from app import __version__
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.redis_client import close_redis, get_redis
from app.db.base import Base
from app.db.seed import seed_all
from app.db.session import AsyncSessionLocal, engine
from app.middleware.security import SecurityHeadersMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables & seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        try:
            await seed_all(session)
        except Exception as exc:
            await session.rollback()
            print(f"[seed] Warning: {exc}")
    # Warm redis
    try:
        r = await get_redis()
        await r.ping()
    except Exception as exc:
        print(f"[redis] Warning: {exc}")
    yield
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description=(
        "Official API for Royal Rail Restro, Gaya, Bihar — "
        "menu, ordering, reservations, admin & developer tooling."
    ),
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if settings.app_debug:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "success": False},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "success": False},
    )


@app.get("/health")
@limiter.limit("30/minute")
async def health(request: Request):
    db_ok = "ok"
    redis_ok = "ok"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = "error"
    try:
        r = await get_redis()
        await r.ping()
    except Exception:
        redis_ok = "error"
    cloudinary = "configured" if settings.cloudinary_cloud_name else "not_configured"
    status = "healthy" if db_ok == "ok" else "degraded"
    return {
        "status": status,
        "app": settings.app_name,
        "version": __version__,
        "database": db_ok,
        "redis": redis_ok,
        "cloudinary": cloudinary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": __version__,
        "docs": "/docs",
        "health": "/health",
    }


app.include_router(api_router, prefix=settings.api_v1_prefix)


# Import models so metadata is complete
from app import models as _models  # noqa: E402, F401
