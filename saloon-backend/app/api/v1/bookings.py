from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from app.core.deps import DbSession, get_current_user, require_roles
from app.models.enums import BookingStatus, UserRole
from app.schemas.booking import BookingOut, CancelBookingIn, CreateBookingIn, UpdateBookingStatusIn
from app.schemas.common import Page
from app.services.booking_service import BookingService
from app.repositories.booking_repo import BookingRepository

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(UserRole.CUSTOMER))])
async def create_booking(payload: CreateBookingIn, db: DbSession, user=Depends(get_current_user)):
    svc = BookingService(db)
    return await svc.create(user_id=user.id, payload=payload)


@router.get("/me", response_model=Page[BookingOut], dependencies=[Depends(require_roles(UserRole.CUSTOMER))])
async def list_my_bookings(
    db: DbSession,
    user=Depends(get_current_user),
    status: BookingStatus | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    repo = BookingRepository(db)
    items, total = await repo.list_for_customer(user.id, status=status, date_from=date_from, date_to=date_to, page=page, size=size)
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)


@router.get("", response_model=Page[BookingOut])
async def list_bookings(
    db: DbSession,
    actor=Depends(get_current_user),
    saloon_id: UUID | None = Query(default=None),
    barber_id: UUID | None = Query(default=None),
    customer_id: UUID | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    status: BookingStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    from app.core.exceptions import ForbiddenError
    if actor.role not in (UserRole.OWNER.value, UserRole.SUPER_ADMIN.value):
        raise ForbiddenError("Not authorized")
    repo = BookingRepository(db)
    items, total = await repo.list_all(
        saloon_id=saloon_id,
        barber_id=barber_id,
        customer_id=customer_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        page=page,
        size=size,
    )
    return Page(items=items, total=total, page=page, size=size, has_next=(page * size) < total)


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(booking_id: UUID, db: DbSession, actor=Depends(get_current_user)):
    from app.core.exceptions import NotFoundError, ForbiddenError
    repo = BookingRepository(db)
    booking = await repo.get_by_id(booking_id)
    if not booking:
        raise NotFoundError("Booking not found")
    if actor.role == UserRole.CUSTOMER.value and booking.customer_id != actor.id:
        raise ForbiddenError("Not authorized")
    if actor.role == UserRole.BARBER.value and booking.barber_id != actor.id:
        raise ForbiddenError("Not authorized")
    return booking


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(booking_id: UUID, payload: CancelBookingIn, db: DbSession, actor=Depends(get_current_user)):
    svc = BookingService(db)
    return await svc.cancel(actor=actor, booking_id=booking_id, reason=payload.reason)


@router.patch("/{booking_id}/status", response_model=BookingOut)
async def update_booking_status(booking_id: UUID, payload: UpdateBookingStatusIn, db: DbSession, actor=Depends(get_current_user)):
    svc = BookingService(db)
    return await svc.update_status(actor=actor, booking_id=booking_id, payload=payload)
