"""Royal Rail Restro — FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text

from app import __version__
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.limiter import limiter
from app.core.redis_client import close_redis, get_redis
from app.db.base import Base
from app.db.seed import seed_all
from app.db.session import AsyncSessionLocal, engine
from app.middleware.security import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables & seed catalogue
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[startup] tables ready")
    except Exception as exc:
        print(f"[startup] create_all failed: {exc}")
        traceback.print_exc()

    try:
        async with AsyncSessionLocal() as session:
            stats = await seed_all(session, do_commit=True)
            print(f"[seed] completed successfully: {stats}")
    except Exception as exc:
        print(f"[seed] Warning: {exc}")
        traceback.print_exc()

    try:
        r = await get_redis()
        await r.ping()
        print("[redis] connected")
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
# Without this middleware, `default_limits` is silently never enforced except
# on routes that carry an explicit @limiter.limit(...) decorator — every other
# route (login, signup, order creation, etc.) would have no rate limit at all.
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(SecurityHeadersMiddleware)

# CORS — allow configured origins + Vercel previews when cors_allow_all
# Note: do not combine allow_origins=["*"] with allow_credentials=True
_cors_kwargs: dict = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "expose_headers": ["X-Request-ID"],
}
if settings.cors_allow_all:
    # Reflect any browser Origin (Vercel production + preview deployments)
    _cors_kwargs["allow_origin_regex"] = r"https?://.*"
    # Explicit list still helps non-browser clients / tools
    _cors_kwargs["allow_origins"] = settings.cors_origins_list
else:
    _cors_kwargs["allow_origins"] = settings.cors_origins_list

app.add_middleware(CORSMiddleware, **_cors_kwargs)


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
        "api": settings.api_v1_prefix,
    }


app.include_router(api_router, prefix=settings.api_v1_prefix)

# Import models so metadata is complete
from app import models as _models  # noqa: E402, F401
