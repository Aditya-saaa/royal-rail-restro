"""Database engine and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.app_debug,
    pool_pre_ping=True,
    # Recycle connections before Render's Postgres (or the network path to it)
    # can silently drop them for being idle. pool_pre_ping only validates a
    # connection at checkout time, so a connection that goes stale while just
    # sitting in the pool between requests won't be caught by pre_ping alone —
    # this is the fix for asyncpg.exceptions.ConnectionDoesNotExistError
    # showing up after periods of low traffic / after the free-tier DB naps.
    pool_recycle=280,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
