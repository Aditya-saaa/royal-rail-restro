"""Async Redis client for caching and session support."""

from typing import Any, Optional

import orjson
from redis import asyncio as aioredis

from app.core.config import settings

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=False,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


async def cache_get(key: str) -> Any | None:
    r = await get_redis()
    data = await r.get(key)
    if data is None:
        return None
    try:
        return orjson.loads(data)
    except Exception:
        return data.decode() if isinstance(data, bytes) else data


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    r = await get_redis()
    payload = orjson.dumps(value)
    await r.set(key, payload, ex=ttl)


async def cache_delete(key: str) -> None:
    r = await get_redis()
    await r.delete(key)


async def cache_delete_pattern(pattern: str) -> None:
    r = await get_redis()
    async for key in r.scan_iter(match=pattern):
        await r.delete(key)
