from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.core.deps import DbSession, get_current_user
from app.schemas.service import CreateServiceIn, ServiceOut, UpdateServiceIn
from app.services.service_service import ServiceService

router = APIRouter(tags=["services"])


@router.post("/saloons/{saloon_id}/services", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
async def create_service(saloon_id: UUID, payload: CreateServiceIn, db: DbSession, actor=Depends(get_current_user)):
    svc = ServiceService(db)
    return await svc.create(saloon_id, payload, actor)


@router.get("/services/{service_id}", response_model=ServiceOut)
async def get_service(service_id: UUID, db: DbSession):
    svc = ServiceService(db)
    return await svc.get_by_id(service_id)


@router.patch("/services/{service_id}", response_model=ServiceOut)
async def update_service(service_id: UUID, payload: UpdateServiceIn, db: DbSession, actor=Depends(get_current_user)):
    svc = ServiceService(db)
    return await svc.update(service_id, payload, actor)


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: UUID, db: DbSession, actor=Depends(get_current_user)):
    svc = ServiceService(db)
    await svc.soft_delete(service_id, actor)
