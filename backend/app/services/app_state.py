"""Small durable state store used by the production booking and schedule workflows."""

from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from backend.app.database.session import AsyncSessionLocal, engine
from backend.app.models.entities import ApplicationState

_state_table_ready = False


async def ensure_state_table() -> None:
    """Initialize lazily as a fallback for ASGI runners that skip lifespan hooks."""
    global _state_table_ready
    if _state_table_ready:
        return
    async with engine.begin() as connection:
        await connection.run_sync(ApplicationState.__table__.create, checkfirst=True)
    _state_table_ready = True


async def read_state(key: str) -> Optional[Dict[str, Any]]:
    await ensure_state_table()
    async with AsyncSessionLocal() as session:
        row = await session.get(ApplicationState, key)
        return row.value if row else None


async def write_state(key: str, value: Dict[str, Any]) -> None:
    await ensure_state_table()
    async with AsyncSessionLocal() as session:
        row = await session.get(ApplicationState, key, with_for_update=True)
        if row is None:
            session.add(ApplicationState(key=key, value=value))
        else:
            row.value = value
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
            row = await session.get(ApplicationState, key, with_for_update=True)
            if row is None:
                raise
            row.value = value
            await session.commit()


async def seed_state(key: str, value: Dict[str, Any]) -> None:
    await ensure_state_table()
    async with AsyncSessionLocal() as session:
        if await session.get(ApplicationState, key) is not None:
            return
        session.add(ApplicationState(key=key, value=value))
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()

\n