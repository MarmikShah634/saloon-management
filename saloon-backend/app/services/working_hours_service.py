from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.models.time_off import TimeOff
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.barber_repo import BarberRepository
from app.repositories.time_off_repo import TimeOffRepository
from app.schemas.time_off import CreateTimeOffIn
from app.utils.ids import new_id


class TimeOffService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.barbers = BarberRepository(db)
        self.time_offs = TimeOffRepository(db)
        self.audit = AuditRepository(db)

    async def list_time_off(self, barber_id: UUID, actor: User) -> list[TimeOff]:
        barber = await self.barbers.get_by_id(barber_id)
        if not barber:
            raise NotFoundError("Barber not found")
        self._check_access(barber, actor)
        return await self.time_offs.list_by_barber(barber_id, upcoming_only=True)

    async def create_time_off(self, barber_id: UUID, payload: CreateTimeOffIn, actor: User) -> TimeOff:
        barber = await self.barbers.get_by_id(barber_id)
        if not barber:
            raise NotFoundError("Barber not found")
        self._check_access(barber, actor)
        time_off = TimeOff(
            id=new_id(),
            barber_id=barber_id,
            start_at=payload.start_at,
            end_at=payload.end_at,
            reason=payload.reason,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(time_off)
        await self.db.flush()
        await self.audit.write(actor.id, actor.role, "barber.time_off_add", "barber", barber_id)
        return time_off

    async def delete_time_off(self, time_off_id: UUID, actor: User) -> None:
        time_off = await self.time_offs.get_by_id(time_off_id)
        if not time_off:
            raise NotFoundError("Time off not found")
        barber = await self.barbers.get_by_id(time_off.barber_id)
        if barber:
            self._check_access(barber, actor)
        await self.db.delete(time_off)
        await self.db.flush()
        if barber:
            await self.audit.write(actor.id, actor.role, "barber.time_off_remove", "barber", barber.id)

    def _check_access(self, barber, actor: User) -> None:
        if actor.role == UserRole.SUPER_ADMIN.value:
            return
        if actor.role == UserRole.OWNER.value:
            return
        if actor.role == UserRole.BARBER.value and barber.user_id == actor.id:
            return
        raise ForbiddenError("Not authorized")
