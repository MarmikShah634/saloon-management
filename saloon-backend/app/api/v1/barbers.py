from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.core.deps import DbSession, get_current_user
from app.schemas.barber import BarberOut, CreateBarberIn, UpdateBarberIn
from app.schemas.service import ServiceOut
from app.schemas.working_hours import SetWorkingHoursIn, WorkingHoursOut
from app.schemas.booking import BookingOut
from app.schemas.common import Page
from app.services.barber_service import BarberService
from app.repositories.barber_repo import BarberRepository
from app.repositories.service_repo import ServiceRepository
from app.repositories.booking_repo import BookingRepository
from fastapi import Query
from datetime import date
from app.models.enums import BookingStatus

router = APIRouter(tags=["barbers"])


@router.post("/saloons/{saloon_id}/barbers", response_model=BarberOut, status_code=status.HTTP_201_CREATED)
async def create_barber(saloon_id: UUID, payload: CreateBarberIn, db: DbSession, actor=Depends(get_current_user)):
    svc = BarberService(db)
    return await svc.create_barber(saloon_id, payload, actor)


@router.get("/barbers/{barber_id}", response_model=BarberOut)
async def get_barber(barber_id: UUID, db: DbSession):
    svc = BarberService(db)
    barber = await svc.get_by_id(barber_id)
    out = BarberOut.model_validate(barber)
    if barber.user:
        out.name = barber.user.name
        out.email = barber.user.email
    return out


@router.patch("/barbers/{barber_id}", response_model=BarberOut)
async def update_barber(barber_id: UUID, payload: UpdateBarberIn, db: DbSession, actor=Depends(get_current_user)):
    svc = BarberService(db)
    return await svc.update(barber_id, payload, actor)


@router.delete("/barbers/{barber_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_barber(barber_id: UUID, db: DbSession, actor=Depends(get_current_user)):
    svc = BarberService(db)
    await svc.soft_delete(barber_id, actor)


@router.get("/barbers/{barber_id}/services", response_model=list[ServiceOut])
async def get_barber_services(barber_id: UUID, db: DbSession):
    repo = BarberRepository(db)
    barber = await repo.get_by_id(barber_id)
    if not barber:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Barber not found")
    svc_repo = ServiceRepository(db)
    svc_ids = [bs.service_id for bs in barber.barber_services]
    if not svc_ids:
        return []
    return await svc_repo.get_many_by_ids(svc_ids)


@router.put("/barbers/{barber_id}/services", status_code=status.HTTP_204_NO_CONTENT)
async def set_barber_services(barber_id: UUID, service_ids: list[UUID], db: DbSession, actor=Depends(get_current_user)):
    svc = BarberService(db)
    await svc.set_services(barber_id, service_ids, actor)


@router.get("/barbers/{barber_id}/working-hours", response_model=list[WorkingHoursOut])
async def get_working_hours(barber_id: UUID, db: DbSession):
    from app.repositories.working_hours_repo import WorkingHoursRepository
    repo = WorkingHoursRepository(db)
    return await repo.list_by_barber(barber_id)


@router.put("/barbers/{barber_id}/working-hours", response_model=list[WorkingHoursOut])
async def set_working_hours(barber_id: UUID, payload: SetWorkingHoursIn, db: DbSession, actor=Depends(get_current_user)):
    svc = BarberService(db)
    return await svc.set_working_hours(barber_id, payload, actor)


@router.get("/barbers/{barber_id}/bookings", response_model=Page[BookingOut])
async def get_barber_bookings(
    barber_id: UUID,
    db: DbSession,
    actor=Depends(get_current_user),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    status: BookingStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    repo = BookingRepository(db)
    items, total = await repo.list_for_barber(barber_id, date_from=date_from, date_to=date_to, status=status, page=page, size=size)
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)
