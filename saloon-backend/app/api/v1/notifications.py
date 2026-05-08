from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.core.deps import DbSession, get_current_user
from app.schemas.common import Page
from app.schemas.notification import NotificationOut
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=Page[NotificationOut])
async def list_notifications(
    db: DbSession,
    user=Depends(get_current_user),
    unread_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    svc = NotificationService(db)
    items, total = await svc.list_for_user(user.id, unread_only=unread_only, page=page, size=size)
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)


@router.post("/{notif_id}/read", response_model=NotificationOut)
async def mark_read(notif_id: UUID, db: DbSession, user=Depends(get_current_user)):
    svc = NotificationService(db)
    return await svc.mark_read(notif_id, user.id)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(db: DbSession, user=Depends(get_current_user)):
    svc = NotificationService(db)
    await svc.mark_all_read(user.id)
