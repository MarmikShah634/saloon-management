from uuid import UUID
from sqlalchemy import select
from app.models.service import Service
from app.repositories.base import BaseRepository


class ServiceRepository(BaseRepository[Service]):
    model = Service

    async def get_by_id(self, id_: UUID | str) -> Service | None:
        q = select(Service).where(Service.id == id_, Service.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def list_by_saloon(self, saloon_id: UUID, active_only: bool = False) -> list[Service]:
        q = select(Service).where(Service.saloon_id == saloon_id, Service.deleted_at.is_(None))
        if active_only:
            q = q.where(Service.is_active.is_(True))
        return list((await self.db.execute(q)).scalars().all())

    async def get_many_by_ids(self, ids: list[UUID]) -> list[Service]:
        q = select(Service).where(Service.id.in_(ids), Service.deleted_at.is_(None))
        return list((await self.db.execute(q)).scalars().all())
