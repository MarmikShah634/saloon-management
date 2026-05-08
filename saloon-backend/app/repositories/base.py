from typing import Generic, TypeVar, Type
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base

M = TypeVar("M", bound=Base)


class BaseRepository(Generic[M]):
    model: Type[M]

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id_: UUID | str) -> M | None:
        return await self.db.get(self.model, id_)

    async def add(self, obj: M) -> M:
        self.db.add(obj)
        await self.db.flush()
        return obj

    async def delete(self, obj: M) -> None:
        await self.db.delete(obj)
        await self.db.flush()
