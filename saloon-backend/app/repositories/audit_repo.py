from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select, func
from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository
from app.utils.ids import new_id


class AuditRepository(BaseRepository[AuditLog]):
    model = AuditLog

    async def write(
        self,
        actor_user_id: UUID | None,
        actor_role: str | None,
        action: str,
        entity_type: str,
        entity_id: UUID | None = None,
        before: dict | None = None,
        after: dict | None = None,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:
        log = AuditLog(
            id=new_id(),
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before=before,
            after=after,
            ip=ip,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_audit(
        self,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        actor_user_id: UUID | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[AuditLog], int]:
        base = select(AuditLog)
        if entity_type:
            base = base.where(AuditLog.entity_type == entity_type)
        if entity_id:
            base = base.where(AuditLog.entity_id == entity_id)
        if actor_user_id:
            base = base.where(AuditLog.actor_user_id == actor_user_id)

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        rows = (
            await self.db.execute(
                base.order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size)
            )
        ).scalars().all()
        return list(rows), total
