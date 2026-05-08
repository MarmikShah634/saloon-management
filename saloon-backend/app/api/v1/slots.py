from datetime import date
from uuid import UUID
from fastapi import APIRouter, Query, Request
from app.core.deps import DbSession
from app.core.rate_limit import limiter
from app.core.exceptions import ValidationError
from app.schemas.slot import SlotsOut
from app.services.slot_service import get_slots_for_barber, get_slots_for_any_barber

router = APIRouter(prefix="/slots", tags=["slots"])


def _parse_uuids(service_ids_str: str) -> list[UUID]:
    try:
        return [UUID(s.strip()) for s in service_ids_str.split(",") if s.strip()]
    except ValueError:
        raise ValidationError("Invalid UUID in service_ids")


@router.get("/specific", response_model=SlotsOut)
@limiter.limit("60/minute")
async def get_specific_slots(
    request: Request,
    db: DbSession,
    barber_id: UUID = Query(...),
    date: date = Query(...),
    service_ids: str = Query(..., description="Comma-separated UUIDs"),
):
    svc_ids = _parse_uuids(service_ids)
    if not svc_ids or len(svc_ids) > 10:
        raise ValidationError("service_ids must have 1-10 items")

    from app.repositories.service_repo import ServiceRepository
    svc_repo = ServiceRepository(db)
    services = await svc_repo.get_many_by_ids(svc_ids)
    total_duration = sum(s.duration_mins for s in services)

    slots = await get_slots_for_barber(db, barber_id, date, total_duration)
    return SlotsOut(items=slots, total_duration_mins=total_duration)


@router.get("/any", response_model=SlotsOut)
@limiter.limit("60/minute")
async def get_any_slots(
    request: Request,
    db: DbSession,
    saloon_id: UUID = Query(...),
    date: date = Query(...),
    service_ids: str = Query(..., description="Comma-separated UUIDs"),
):
    svc_ids = _parse_uuids(service_ids)
    if not svc_ids or len(svc_ids) > 10:
        raise ValidationError("service_ids must have 1-10 items")

    from app.repositories.service_repo import ServiceRepository
    svc_repo = ServiceRepository(db)
    services = await svc_repo.get_many_by_ids(svc_ids)
    total_duration = sum(s.duration_mins for s in services)

    slots = await get_slots_for_any_barber(db, saloon_id, date, svc_ids)
    return SlotsOut(items=slots, total_duration_mins=total_duration)
