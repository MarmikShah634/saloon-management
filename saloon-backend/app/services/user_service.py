from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundError
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.user_repo import UserRepository
from app.schemas.user import UpdateProfileIn, UpdateUserStatusIn


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)
        self.audit = AuditRepository(db)

    async def update_profile(self, user: User, payload: UpdateProfileIn) -> User:
        if payload.name is not None:
            user.name = payload.name
        if payload.phone is not None:
            user.phone = payload.phone
        user.updated_at = datetime.now(timezone.utc)
        await self.audit.write(user.id, user.role, "user.update", "user", user.id)
        return user

    async def get_by_id(self, user_id: UUID) -> User:
        user = await self.users.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    async def update_status(self, user_id: UUID, payload: UpdateUserStatusIn, actor: User) -> User:
        user = await self.get_by_id(user_id)
        before = {"status": user.status}
        user.status = payload.status.value
        user.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "user.status_change", "user", user.id, before, {"status": user.status})
        return user

    async def list_users(
        self,
        role: UserRole | None = None,
        status: UserStatus | None = None,
        q: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[User], int]:
        return await self.users.list_users(role=role, status=status, q=q, page=page, size=size)
