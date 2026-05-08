from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.enums import SaloonStatus, UserRole
from app.models.saloon import Saloon
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.saloon_repo import SaloonRepository
from app.schemas.saloon import CreateSaloonIn, UpdateSaloonIn, UpdateSaloonStatusIn, AddPhotoIn
from app.utils.ids import new_id


class SaloonService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.saloons = SaloonRepository(db)
        self.audit = AuditRepository(db)

    async def create(self, payload: CreateSaloonIn, actor: User) -> Saloon:
        existing = await self.saloons.get_by_slug(payload.slug)
        if existing:
            raise ConflictError("Slug already taken")
        saloon = Saloon(
            id=new_id(),
            owner_id=payload.owner_id,
            name=payload.name,
            slug=payload.slug,
            address=payload.address,
            city=payload.city,
            lat=payload.lat,
            lng=payload.lng,
            phone=payload.phone,
            photos=[],
            default_open=payload.default_open,
            default_close=payload.default_close,
            timezone=payload.timezone,
            status=SaloonStatus.PENDING_APPROVAL.value,
            description=payload.description,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await self.saloons.add(saloon)
        await self.audit.write(actor.id, actor.role, "saloon.create", "saloon", saloon.id)
        return saloon

    async def get_by_id(self, saloon_id: UUID) -> Saloon:
        saloon = await self.saloons.get_by_id(saloon_id)
        if not saloon:
            raise NotFoundError("Saloon not found")
        return saloon

    async def get_by_slug(self, slug: str) -> Saloon:
        saloon = await self.saloons.get_by_slug(slug)
        if not saloon:
            raise NotFoundError("Saloon not found")
        return saloon

    async def update(self, saloon_id: UUID, payload: UpdateSaloonIn, actor: User) -> Saloon:
        saloon = await self.get_by_id(saloon_id)
        self._check_owner_or_admin(saloon, actor)
        before = {"name": saloon.name}
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(saloon, field, value)
        saloon.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "saloon.update", "saloon", saloon.id, before)
        return saloon

    async def soft_delete(self, saloon_id: UUID, actor: User) -> None:
        saloon = await self.get_by_id(saloon_id)
        saloon.deleted_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "saloon.delete", "saloon", saloon.id)

    async def update_status(self, saloon_id: UUID, payload: UpdateSaloonStatusIn, actor: User) -> Saloon:
        saloon = await self.get_by_id(saloon_id)
        before = {"status": saloon.status}
        saloon.status = payload.status.value
        saloon.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "saloon.status_change", "saloon", saloon.id, before, {"status": saloon.status})
        return saloon

    async def add_photo(self, saloon_id: UUID, payload: AddPhotoIn, actor: User) -> Saloon:
        saloon = await self.get_by_id(saloon_id)
        self._check_owner_or_admin(saloon, actor)
        photos = list(saloon.photos or [])
        photos.append({"url": payload.url, "caption": payload.caption})
        saloon.photos = photos
        saloon.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "saloon.photo_add", "saloon", saloon.id)
        return saloon

    async def remove_photo(self, saloon_id: UUID, idx: int, actor: User) -> Saloon:
        saloon = await self.get_by_id(saloon_id)
        self._check_owner_or_admin(saloon, actor)
        photos = list(saloon.photos or [])
        if idx < 0 or idx >= len(photos):
            raise NotFoundError("Photo index out of range")
        photos.pop(idx)
        saloon.photos = photos
        saloon.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "saloon.photo_remove", "saloon", saloon.id)
        return saloon

    async def list_saloons(self, **kwargs) -> tuple[list[Saloon], int]:
        return await self.saloons.list_saloons(**kwargs)

    async def transfer_owner(self, saloon_id: UUID, new_owner_id: UUID, actor: User) -> Saloon:
        saloon = await self.get_by_id(saloon_id)
        before = {"owner_id": str(saloon.owner_id)}
        saloon.owner_id = new_owner_id
        saloon.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "saloon.transfer", "saloon", saloon.id, before, {"owner_id": str(new_owner_id)})
        return saloon

    def _check_owner_or_admin(self, saloon: Saloon, actor: User) -> None:
        if actor.role == UserRole.SUPER_ADMIN.value:
            return
        if actor.role == UserRole.OWNER.value and saloon.owner_id == actor.id:
            return
        raise ForbiddenError("Not authorized to modify this saloon")
