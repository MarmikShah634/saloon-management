from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.core.deps import DbSession, get_current_user
from app.schemas.time_off import CreateTimeOffIn, TimeOffOut
from app.services.working_hours_service import TimeOffService

router = APIRouter(tags=["time-off"])


@router.get("/barbers/{barber_id}/time-off", response_model=list[TimeOffOut])
async def get_time_off(barber_id: UUID, db: DbSession, actor=Depends(get_current_user)):
    svc = TimeOffService(db)
    return await svc.list_time_off(barber_id, actor)


@router.post("/barbers/{barber_id}/time-off", response_model=TimeOffOut, status_code=status.HTTP_201_CREATED)
async def create_time_off(barber_id: UUID, payload: CreateTimeOffIn, db: DbSession, actor=Depends(get_current_user)):
    svc = TimeOffService(db)
    return await svc.create_time_off(barber_id, payload, actor)


@router.delete("/time-off/{time_off_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_off(time_off_id: UUID, db: DbSession, actor=Depends(get_current_user)):
    svc = TimeOffService(db)
    await svc.delete_time_off(time_off_id, actor)
