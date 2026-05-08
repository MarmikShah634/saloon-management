from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.barber import Barber, BarberService
from app.repositories.base import BaseRepository


class BarberRepository(BaseRepository[Barber]):
    model = Barber

    async def get_by_id(self, id_: UUID | str) -> Barber | None:
        q = (
            select(Barber)
            .where(Barber.id == id_, Barber.deleted_at.is_(None))
            .options(selectinload(Barber.user), selectinload(Barber.working_hours), selectinload(Barber.time_offs))
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_by_user_id(self, user_id: UUID) -> Barber | None:
        q = select(Barber).where(Barber.user_id == user_id, Barber.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def list_by_saloon(self, saloon_id: UUID) -> list[Barber]:
        q = (
            select(Barber)
            .where(Barber.saloon_id == saloon_id, Barber.deleted_at.is_(None))
            .options(selectinload(Barber.user))
        )
        return list((await self.db.execute(q)).scalars().all())

    async def list_active_by_saloon(self, saloon_id: UUID) -> list[Barber]:
        q = (
            select(Barber)
            .where(Barber.saloon_id == saloon_id, Barber.deleted_at.is_(None), Barber.is_active.is_(True))
            .options(selectinload(Barber.user), selectinload(Barber.barber_services))
        )
        return list((await self.db.execute(q)).scalars().all())

    async def get_barber_services(self, barber_id: UUID) -> list[BarberService]:
        q = select(BarberService).where(BarberService.barber_id == barber_id)
        return list((await self.db.execute(q)).scalars().all())

    async def set_services(self, barber_id: UUID, service_ids: list[UUID]) -> None:
        existing = await self.db.execute(
            select(BarberService).where(BarberService.barber_id == barber_id)
        )
        for row in existing.scalars().all():
            await self.db.delete(row)
        await self.db.flush()
        for svc_id in service_ids:
            self.db.add(BarberService(barber_id=barber_id, service_id=svc_id))
        await self.db.flush()
