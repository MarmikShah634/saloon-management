from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.models.service import Service
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.saloon_repo import SaloonRepository
from app.repositories.service_repo import ServiceRepository
from app.schemas.service import CreateServiceIn, UpdateServiceIn
from app.utils.ids import new_id


class ServiceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.services = ServiceRepository(db)
        self.saloons = SaloonRepository(db)
        self.audit = AuditRepository(db)

    async def create(self, saloon_id: UUID, payload: CreateServiceIn, actor: User) -> Service:
        saloon = await self.saloons.get_by_id(saloon_id)
        if not saloon:
            raise NotFoundError("Saloon not found")
        self._check_owner_or_admin(saloon, actor)

        svc = Service(
            id=new_id(),
            saloon_id=saloon_id,
            name=payload.name,
            description=payload.description,
            duration_mins=payload.duration_mins,
            price=payload.price,
            deposit_pct=payload.deposit_pct,
            category=payload.category,
            is_active=payload.is_active,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await self.services.add(svc)
        await self.audit.write(actor.id, actor.role, "service.create", "service", svc.id)
        return svc

    async def get_by_id(self, service_id: UUID) -> Service:
        svc = await self.services.get_by_id(service_id)
        if not svc:
            raise NotFoundError("Service not found")
        return svc

    async def update(self, service_id: UUID, payload: UpdateServiceIn, actor: User) -> Service:
        svc = await self.get_by_id(service_id)
        saloon = await self.saloons.get_by_id(svc.saloon_id)
        if saloon:
            self._check_owner_or_admin(saloon, actor)
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(svc, field, value)
        svc.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "service.update", "service", svc.id)
        return svc

    async def soft_delete(self, service_id: UUID, actor: User) -> None:
        svc = await self.get_by_id(service_id)
        saloon = await self.saloons.get_by_id(svc.saloon_id)
        if saloon:
            self._check_owner_or_admin(saloon, actor)
        svc.deleted_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "service.delete", "service", svc.id)

    async def list_by_saloon(self, saloon_id: UUID) -> list[Service]:
        return await self.services.list_by_saloon(saloon_id)

    def _check_owner_or_admin(self, saloon, actor: User) -> None:
        if actor.role == UserRole.SUPER_ADMIN.value:
            return
        if actor.role == UserRole.OWNER.value and saloon.owner_id == actor.id:
            return
        raise ForbiddenError("Not authorized")
