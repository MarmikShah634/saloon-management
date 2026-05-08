from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.core.deps import DbSession, get_current_user, require_roles
from app.models.enums import UserRole, UserStatus
from app.schemas.common import Page
from app.schemas.user import UpdateProfileIn, UpdateUserStatusIn, UserOut
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(user=Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(payload: UpdateProfileIn, db: DbSession, user=Depends(get_current_user)):
    svc = UserService(db)
    return await svc.update_profile(user, payload)


@router.get("/{user_id}", response_model=UserOut, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def get_user(user_id: UUID, db: DbSession):
    svc = UserService(db)
    return await svc.get_by_id(user_id)


@router.patch("/{user_id}/status", response_model=UserOut, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def update_user_status(user_id: UUID, payload: UpdateUserStatusIn, db: DbSession, actor=Depends(get_current_user)):
    svc = UserService(db)
    return await svc.update_status(user_id, payload, actor)


@router.get("", response_model=Page[UserOut], dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def list_users(
    db: DbSession,
    role: UserRole | None = Query(default=None),
    status: UserStatus | None = Query(default=None),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    svc = UserService(db)
    items, total = await svc.list_users(role=role, status=status, q=q, page=page, size=size)
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)
