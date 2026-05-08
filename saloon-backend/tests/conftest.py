import asyncio
import uuid
from unittest.mock import MagicMock, patch
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy import JSON, String
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.models.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


class SQLiteUUID(TypeDecorator):
    """UUID stored as String for SQLite compatibility."""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return uuid.UUID(str(value))


def _patch_metadata_for_sqlite(metadata):
    """Replace PostgreSQL-specific types with SQLite-compatible equivalents."""
    from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
    for table in metadata.tables.values():
        for col in table.columns:
            if isinstance(col.type, JSONB):
                col.type = JSON()
            elif isinstance(col.type, PGUUID):
                col.type = SQLiteUUID()


@pytest.fixture(autouse=True)
def mock_celery_tasks():
    """Prevent Celery tasks from connecting to Redis during tests."""
    noop = MagicMock()
    with (
        patch("app.tasks.email_tasks.send_booking_created_email.delay", noop),
        patch("app.tasks.email_tasks.send_booking_cancelled_email.delay", noop),
        patch("app.tasks.email_tasks.send_reminder_email.delay", noop),
    ):
        yield


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    _patch_metadata_for_sqlite(Base.metadata)
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    Session = async_sessionmaker(bind=db_engine, expire_on_commit=False, autoflush=False, class_=AsyncSession)
    async with Session() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
