from uuid import UUID
from fastapi import APIRouter, Depends
from app.core.deps import DbSession, get_current_user
from app.schemas.working_hours import SetWorkingHoursIn, WorkingHoursOut
from app.services.barber_service import BarberService
from app.repositories.working_hours_repo import WorkingHoursRepository

router = APIRouter(tags=["working-hours"])


@router.get("/barbers/{barber_id}/schedule", response_model=list[WorkingHoursOut])
async def get_schedule(barber_id: UUID, db: DbSession):
    repo = WorkingHoursRepository(db)
    return await repo.list_by_barber(barber_id)


@router.put("/barbers/{barber_id}/schedule", response_model=list[WorkingHoursOut])
async def set_schedule(barber_id: UUID, payload: SetWorkingHoursIn, db: DbSession, actor=Depends(get_current_user)):
    svc = BarberService(db)
    return await svc.set_working_hours(barber_id, payload, actor)
