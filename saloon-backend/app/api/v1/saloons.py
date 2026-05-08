from decimal import Decimal
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.core.deps import DbSession, get_current_user, require_roles
from app.models.enums import SaloonStatus, UserRole
from app.schemas.barber import BarberOut
from app.schemas.common import Page
from app.schemas.saloon import AddPhotoIn, CreateSaloonIn, SaloonOut, UpdateSaloonIn, UpdateSaloonStatusIn
from app.schemas.service import ServiceOut
from app.services.barber_service import BarberService
from app.services.saloon_service import SaloonService
from app.services.service_service import ServiceService

router = APIRouter(prefix="/saloons", tags=["saloons"])


@router.get("", response_model=Page[SaloonOut])
async def list_saloons(
    db: DbSession,
    q: str | None = Query(default=None),
    city: str | None = Query(default=None),
    lat: Decimal | None = Query(default=None),
    lng: Decimal | None = Query(default=None),
    radius_km: float | None = Query(default=None),
    sort: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    svc = SaloonService(db)
    items, total = await svc.list_saloons(q=q, city=city, lat=lat, lng=lng, radius_km=radius_km, sort=sort, page=page, size=size, status=SaloonStatus.ACTIVE)
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)


@router.get("/{saloon_id}", response_model=SaloonOut)
async def get_saloon(saloon_id: UUID, db: DbSession):
    svc = SaloonService(db)
    return await svc.get_by_id(saloon_id)


@router.get("/{saloon_id}/barbers", response_model=list[BarberOut])
async def get_saloon_barbers(saloon_id: UUID, db: DbSession):
    svc = BarberService(db)
    barbers = await svc.list_by_saloon(saloon_id)
    result = []
    for b in barbers:
        out = BarberOut.model_validate(b)
        if b.user:
            out.name = b.user.name
            out.email = b.user.email
        result.append(out)
    return result


@router.get("/{saloon_id}/services", response_model=list[ServiceOut])
async def get_saloon_services(saloon_id: UUID, db: DbSession):
    svc = ServiceService(db)
    return await svc.list_by_saloon(saloon_id)


@router.post("", response_model=SaloonOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def create_saloon(payload: CreateSaloonIn, db: DbSession, actor=Depends(get_current_user)):
    svc = SaloonService(db)
    return await svc.create(payload, actor)


@router.patch("/{saloon_id}", response_model=SaloonOut)
async def update_saloon(saloon_id: UUID, payload: UpdateSaloonIn, db: DbSession, actor=Depends(get_current_user)):
    svc = SaloonService(db)
    return await svc.update(saloon_id, payload, actor)


@router.delete("/{saloon_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def delete_saloon(saloon_id: UUID, db: DbSession, actor=Depends(get_current_user)):
    svc = SaloonService(db)
    await svc.soft_delete(saloon_id, actor)


@router.patch("/{saloon_id}/status", response_model=SaloonOut, dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
async def update_saloon_status(saloon_id: UUID, payload: UpdateSaloonStatusIn, db: DbSession, actor=Depends(get_current_user)):
    svc = SaloonService(db)
    return await svc.update_status(saloon_id, payload, actor)


@router.post("/{saloon_id}/photos", response_model=SaloonOut)
async def add_photo(saloon_id: UUID, payload: AddPhotoIn, db: DbSession, actor=Depends(get_current_user)):
    svc = SaloonService(db)
    return await svc.add_photo(saloon_id, payload, actor)


@router.delete("/{saloon_id}/photos/{idx}", response_model=SaloonOut)
async def remove_photo(saloon_id: UUID, idx: int, db: DbSession, actor=Depends(get_current_user)):
    svc = SaloonService(db)
    return await svc.remove_photo(saloon_id, idx, actor)
