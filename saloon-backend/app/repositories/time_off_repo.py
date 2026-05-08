from datetime import datetime
from uuid import UUID
from sqlalchemy import and_, select
from app.models.time_off import TimeOff
from app.repositories.base import BaseRepository


class TimeOffRepository(BaseRepository[TimeOff]):
    model = TimeOff

    async def list_by_barber(self, barber_id: UUID, upcoming_only: bool = False) -> list[TimeOff]:
        q = select(TimeOff).where(TimeOff.barber_id == barber_id)
        if upcoming_only:
            from datetime import timezone
            now = datetime.now(timezone.utc)
            q = q.where(TimeOff.end_at > now)
        return list((await self.db.execute(q.order_by(TimeOff.start_at))).scalars().all())

    async def list_overlapping_day(self, barber_id: UUID, day_start: datetime, day_end: datetime) -> list[TimeOff]:
        q = select(TimeOff).where(
            TimeOff.barber_id == barber_id,
            and_(TimeOff.start_at < day_end, TimeOff.end_at > day_start),
        )
        return list((await self.db.execute(q)).scalars().all())
