from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.security import hash_password
from app.models.barber import Barber
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.barber_repo import BarberRepository
from app.repositories.saloon_repo import SaloonRepository
from app.repositories.service_repo import ServiceRepository
from app.repositories.user_repo import UserRepository
from app.repositories.working_hours_repo import WorkingHoursRepository
from app.schemas.barber import CreateBarberIn, UpdateBarberIn
from app.schemas.working_hours import SetWorkingHoursIn
from app.models.working_hours import BarberWorkingHours
from app.utils.ids import new_id
import secrets
import string


class BarberService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.barbers = BarberRepository(db)
        self.users = UserRepository(db)
        self.saloons = SaloonRepository(db)
        self.services = ServiceRepository(db)
        self.wh = WorkingHoursRepository(db)
        self.audit = AuditRepository(db)

    async def create_barber(self, saloon_id: UUID, payload: CreateBarberIn, actor: User) -> Barber:
        saloon = await self.saloons.get_by_id(saloon_id)
        if not saloon:
            raise NotFoundError("Saloon not found")
        self._check_owner(saloon, actor)

        existing = await self.users.get_by_email(payload.email)
        if existing:
            raise ConflictError("Email already registered")

        temp_password = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
        user = User(
            id=new_id(),
            email=payload.email.lower(),
            phone=payload.phone,
            password_hash=hash_password(temp_password),
            name=payload.name,
            role=UserRole.BARBER.value,
            status="active",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await self.users.add(user)

        barber = Barber(
            id=new_id(),
            user_id=user.id,
            saloon_id=saloon_id,
            bio=payload.bio,
            photo_url=payload.photo_url,
            buffer_mins=payload.buffer_mins,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await self.barbers.add(barber)
        await self.audit.write(actor.id, actor.role, "barber.create", "barber", barber.id)
        return barber

    async def get_by_id(self, barber_id: UUID) -> Barber:
        barber = await self.barbers.get_by_id(barber_id)
        if not barber:
            raise NotFoundError("Barber not found")
        return barber

    async def update(self, barber_id: UUID, payload: UpdateBarberIn, actor: User) -> Barber:
        barber = await self.get_by_id(barber_id)
        self._check_owner_or_self(barber, actor)
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(barber, field, value)
        barber.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "barber.update", "barber", barber.id)
        return barber

    async def soft_delete(self, barber_id: UUID, actor: User) -> None:
        barber = await self.get_by_id(barber_id)
        saloon = await self.saloons.get_by_id(barber.saloon_id)
        if not saloon or (actor.role == UserRole.OWNER.value and saloon.owner_id != actor.id):
            raise ForbiddenError("Not authorized")
        barber.deleted_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "barber.delete", "barber", barber.id)

    async def set_services(self, barber_id: UUID, service_ids: list[UUID], actor: User) -> None:
        barber = await self.get_by_id(barber_id)
        self._check_owner_or_self(barber, actor)
        services = await self.services.get_many_by_ids(service_ids)
        found_ids = {s.id for s in services}
        for sid in service_ids:
            if sid not in found_ids:
                raise NotFoundError(f"Service {sid} not found")
            svc = next(s for s in services if s.id == sid)
            if str(svc.saloon_id) != str(barber.saloon_id):
                raise ForbiddenError(f"Service {sid} does not belong to this saloon")
        await self.barbers.set_services(barber_id, service_ids)
        await self.audit.write(actor.id, actor.role, "barber.services_set", "barber", barber.id)

    async def set_working_hours(self, barber_id: UUID, payload: SetWorkingHoursIn, actor: User) -> list[BarberWorkingHours]:
        barber = await self.get_by_id(barber_id)
        self._check_owner_or_self(barber, actor)
        for entry in payload.schedule:
            if entry.end_time <= entry.start_time:
                from app.core.exceptions import ValidationError
                raise ValidationError("end_time must be after start_time")
        await self.wh.delete_all_for_barber(barber_id)
        new_rows: list[BarberWorkingHours] = []
        for entry in payload.schedule:
            row = BarberWorkingHours(
                id=new_id(),
                barber_id=barber_id,
                weekday=entry.weekday,
                start_time=entry.start_time,
                end_time=entry.end_time,
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(row)
            new_rows.append(row)
        await self.db.flush()
        await self.audit.write(actor.id, actor.role, "barber.working_hours_set", "barber", barber.id)
        return new_rows

    async def list_by_saloon(self, saloon_id: UUID) -> list[Barber]:
        return await self.barbers.list_by_saloon(saloon_id)

    def _check_owner(self, saloon, actor: User) -> None:
        if actor.role == UserRole.SUPER_ADMIN.value:
            return
        if actor.role == UserRole.OWNER.value and saloon.owner_id == actor.id:
            return
        raise ForbiddenError("Not authorized")

    def _check_owner_or_self(self, barber: Barber, actor: User) -> None:
        if actor.role == UserRole.SUPER_ADMIN.value:
            return
        if actor.role == UserRole.OWNER.value:
            return
        if actor.role == UserRole.BARBER.value and barber.user_id == actor.id:
            return
        raise ForbiddenError("Not authorized")
