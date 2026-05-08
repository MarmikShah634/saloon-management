from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.models.enums import NotificationKind
from app.repositories.base import BaseRepository
from app.utils.ids import new_id


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    async def list_for_user(
        self,
        user_id: UUID,
        unread_only: bool = False,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Notification], int]:
        base = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            base = base.where(Notification.read_at.is_(None))
        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        rows = (
            await self.db.execute(
                base.order_by(Notification.created_at.desc()).offset((page - 1) * size).limit(size)
            )
        ).scalars().all()
        return list(rows), total

    async def exists_for_booking(self, user_id: UUID, kind: str, booking_id: str) -> bool:
        q = select(Notification).where(
            Notification.user_id == user_id,
            Notification.kind == kind,
            Notification.data["booking_id"].astext == booking_id,
        )
        row = (await self.db.execute(q)).scalar_one_or_none()
        return row is not None


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def dispatch(
        self,
        kind: NotificationKind,
        user_id: UUID,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> Notification:
        notif = Notification(
            id=new_id(),
            user_id=user_id,
            kind=kind.value,
            title=title,
            body=body,
            data=data or {},
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(notif)
        await self.db.flush()
        return notif

    async def list_for_user(
        self,
        user_id: UUID,
        unread_only: bool = False,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Notification], int]:
        return await self.repo.list_for_user(user_id, unread_only=unread_only, page=page, size=size)

    async def mark_read(self, notif_id: UUID, user_id: UUID) -> Notification:
        from app.core.exceptions import NotFoundError, ForbiddenError
        notif = await self.repo.get_by_id(notif_id)
        if not notif:
            raise NotFoundError("Notification not found")
        if notif.user_id != user_id:
            raise ForbiddenError("Not authorized")
        notif.read_at = datetime.now(timezone.utc)
        return notif

    async def mark_all_read(self, user_id: UUID) -> None:
        notifications, _ = await self.repo.list_for_user(user_id, unread_only=True, size=200)
        now = datetime.now(timezone.utc)
        for n in notifications:
            n.read_at = now
        await self.db.flush()
