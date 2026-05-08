from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.core.deps import DbSession, get_current_user, require_roles
from app.core.security import hash_password
from app.core.exceptions import ConflictError
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.saloon_repo import SaloonRepository
from app.repositories.user_repo import UserRepository
from app.schemas.common import Page
from app.schemas.saloon import SaloonOut
from app.schemas.user import UserOut
from app.services.saloon_service import SaloonService
from app.utils.ids import new_id
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/admin", tags=["admin"])


class CreateOwnerIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)


class TransferSaloonIn(BaseModel):
    owner_id: UUID


@router.post("/owners", response_model=UserOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def create_owner(payload: CreateOwnerIn, db: DbSession, actor=Depends(get_current_user)):
    repo = UserRepository(db)
    existing = await repo.get_by_email(payload.email)
    if existing:
        raise ConflictError("Email already registered")
    import secrets
    import string
    temp_pw = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    user = User(
        id=new_id(),
        email=payload.email.lower(),
        phone=payload.phone,
        password_hash=hash_password(temp_pw),
        name=payload.name,
        role=UserRole.OWNER.value,
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    await repo.add(user)
    audit = AuditRepository(db)
    await audit.write(actor.id, actor.role, "user.create", "user", user.id)
    return user


@router.get("/saloons", response_model=Page[SaloonOut], dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def list_all_saloons(
    db: DbSession,
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    repo = SaloonRepository(db)
    items, total = await repo.list_saloons(q=q, page=page, size=size)
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)


@router.patch("/saloons/{saloon_id}/transfer", response_model=SaloonOut, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def transfer_saloon(saloon_id: UUID, payload: TransferSaloonIn, db: DbSession, actor=Depends(get_current_user)):
    svc = SaloonService(db)
    return await svc.transfer_owner(saloon_id, payload.owner_id, actor)


@router.get("/audit-log", dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def get_audit_log(
    db: DbSession,
    entity_type: str | None = Query(default=None),
    entity_id: UUID | None = Query(default=None),
    actor_user_id: UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    repo = AuditRepository(db)
    items, total = await repo.list_audit(
        entity_type=entity_type,
        entity_id=entity_id,
        actor_user_id=actor_user_id,
        page=page,
        size=size,
    )
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)
