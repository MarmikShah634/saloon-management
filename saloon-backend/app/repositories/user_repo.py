from uuid import UUID
from sqlalchemy import func, select
from app.models.user import User
from app.models.enums import UserRole, UserStatus
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        q = select(User).where(func.lower(User.email) == email.lower(), User.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def get_by_id(self, id_: UUID | str) -> User | None:
        q = select(User).where(User.id == id_, User.deleted_at.is_(None))
        return (await self.db.execute(q)).scalar_one_or_none()

    async def list_users(
        self,
        role: UserRole | None = None,
        status: UserStatus | None = None,
        q: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[User], int]:
        base = select(User).where(User.deleted_at.is_(None))
        if role:
            base = base.where(User.role == role.value)
        if status:
            base = base.where(User.status == status.value)
        if q:
            base = base.where(User.name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%"))

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        rows = (await self.db.execute(base.offset((page - 1) * size).limit(size))).scalars().all()
        return list(rows), total
