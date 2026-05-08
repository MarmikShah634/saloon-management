from datetime import datetime
from uuid import UUID
from app.models.enums import NotificationKind
from app.schemas.common import ORMBase


class NotificationOut(ORMBase):
    id: UUID
    user_id: UUID
    kind: NotificationKind
    title: str
    body: str
    data: dict
    read_at: datetime | None
    created_at: datetime
