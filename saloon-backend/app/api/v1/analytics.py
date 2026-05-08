from datetime import date, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.core.deps import DbSession, get_current_user, require_roles
from app.models.enums import UserRole
from app.schemas.analytics import OwnerOverviewOut, SuperAdminOverviewOut
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/owner/overview", response_model=OwnerOverviewOut, dependencies=[Depends(require_roles(UserRole.OWNER, UserRole.SUPER_ADMIN))])
async def owner_overview(
    db: DbSession,
    actor=Depends(get_current_user),
    saloon_id: UUID = Query(...),
    date_from: date = Query(default=None),
    date_to: date = Query(default=None),
):
    from datetime import datetime, timezone
    if date_from is None:
        date_from = (datetime.now(timezone.utc) - timedelta(days=30)).date()
    if date_to is None:
        date_to = datetime.now(timezone.utc).date()
    svc = AnalyticsService(db)
    return await svc.owner_overview(saloon_id, date_from, date_to)


@router.get("/super-admin/overview", response_model=SuperAdminOverviewOut, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def super_admin_overview(
    db: DbSession,
    date_from: date = Query(default=None),
    date_to: date = Query(default=None),
):
    from datetime import datetime, timezone
    if date_from is None:
        date_from = (datetime.now(timezone.utc) - timedelta(days=30)).date()
    if date_to is None:
        date_to = datetime.now(timezone.utc).date()
    svc = AnalyticsService(db)
    return await svc.super_admin_overview(date_from, date_to)
