from uuid import UUID
from sqlalchemy import select
from app.models.working_hours import BarberWorkingHours
from app.repositories.base import BaseRepository


class WorkingHoursRepository(BaseRepository[BarberWorkingHours]):
    model = BarberWorkingHours

    async def list_by_barber(self, barber_id: UUID) -> list[BarberWorkingHours]:
        q = select(BarberWorkingHours).where(BarberWorkingHours.barber_id == barber_id)
        return list((await self.db.execute(q)).scalars().all())

    async def list_by_barber_weekday(self, barber_id: UUID, weekday: int) -> list[BarberWorkingHours]:
        q = select(BarberWorkingHours).where(
            BarberWorkingHours.barber_id == barber_id,
            BarberWorkingHours.weekday == weekday,
        )
        return list((await self.db.execute(q)).scalars().all())

    async def delete_all_for_barber(self, barber_id: UUID) -> None:
        rows = await self.list_by_barber(barber_id)
        for row in rows:
            await self.db.delete(row)
        await self.db.flush()
