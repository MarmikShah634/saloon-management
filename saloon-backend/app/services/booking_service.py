from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.booking import Booking, BookingItem
from app.models.enums import AssignedType, BookingStatus, CancelledBy, UserRole
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.barber_repo import BarberRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.saloon_repo import SaloonRepository
from app.repositories.service_repo import ServiceRepository
from app.schemas.booking import CreateBookingIn, CancelBookingIn, UpdateBookingStatusIn
from app.services.slot_service import get_slots_for_any_barber, get_slots_for_barber
from app.utils.ids import new_id

settings = get_settings()

VALID_TRANSITIONS: dict[str, list[str]] = {
    BookingStatus.CONFIRMED.value: [
        BookingStatus.IN_PROGRESS.value,
        BookingStatus.CANCELLED.value,
        BookingStatus.NO_SHOW.value,
    ],
    BookingStatus.IN_PROGRESS.value: [BookingStatus.COMPLETED.value],
}


class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.bookings = BookingRepository(db)
        self.barbers = BarberRepository(db)
        self.saloons = SaloonRepository(db)
        self.services = ServiceRepository(db)
        self.audit = AuditRepository(db)

    async def create(self, user_id: UUID, payload: CreateBookingIn) -> Booking:
        if True:  # block for readability (previously a transaction context)
            services = await self._load_services(payload.saloon_id, payload.service_ids)
            total_duration = sum(s.duration_mins for s in services)

            if payload.barber_id is None:
                options = await get_slots_for_any_barber(self.db, payload.saloon_id, payload.date, payload.service_ids)
                chosen = next((o for o in options if o.start_at == payload.start_at), None)
                if not chosen:
                    raise ConflictError("Slot no longer available")
                barber_id = chosen.barber_id
                assigned_type = AssignedType.ANY.value
            else:
                options = await get_slots_for_barber(self.db, payload.barber_id, payload.date, total_duration)
                if not any(o.start_at == payload.start_at for o in options):
                    raise ConflictError("Slot no longer available")
                barber_id = payload.barber_id
                assigned_type = AssignedType.SPECIFIC.value

            # Advisory lock to prevent race condition (PostgreSQL only)
            lock_key = f"barber:{barber_id}:{payload.date}"
            try:
                await self.db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": lock_key})
            except Exception:
                pass  # Non-PostgreSQL databases (e.g. SQLite in tests) don't support advisory locks

            end_at = payload.start_at + timedelta(minutes=total_duration)
            overlapping = await self.bookings.list_overlapping(barber_id, payload.start_at, end_at)
            if overlapping:
                raise ConflictError("Slot just got taken")

            # Build booking items
            cursor = payload.start_at
            items: list[BookingItem] = []
            total_price = Decimal("0")
            deposit_amount = Decimal("0")

            for idx, svc in enumerate(services):
                item_start = cursor
                item_end = cursor + timedelta(minutes=svc.duration_mins)
                item = BookingItem(
                    id=new_id(),
                    service_id=svc.id,
                    start_at=item_start,
                    end_at=item_end,
                    order_index=idx,
                    price_snapshot=svc.price,
                    duration_snapshot=svc.duration_mins,
                    service_name_snapshot=svc.name,
                )
                items.append(item)
                total_price += svc.price
                cursor = item_end

            deposit_pct = Decimal(str(settings.DEFAULT_DEPOSIT_PCT))
            deposit_amount = (total_price * deposit_pct / Decimal("100")).quantize(Decimal("0.01"))

            booking = Booking(
                id=new_id(),
                customer_id=user_id,
                barber_id=barber_id,
                saloon_id=payload.saloon_id,
                date=payload.date,
                start_at=payload.start_at,
                end_at=cursor,
                status=BookingStatus.CONFIRMED.value,
                total_price=total_price,
                deposit_amount=deposit_amount,
                deposit_paid=False,
                assigned_type=assigned_type,
                customer_notes=payload.customer_notes,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self.db.add(booking)
            await self.db.flush()

            for item in items:
                item.booking_id = booking.id
                self.db.add(item)
            await self.db.flush()

            await self.audit.write(user_id, UserRole.CUSTOMER.value, "booking.create", "booking", booking.id)

        # After transaction — enqueue notifications
        from app.tasks.email_tasks import send_booking_created_email
        send_booking_created_email.delay(str(booking.id))

        return await self.bookings.get_by_id(booking.id)

    async def cancel(self, actor: User, booking_id: UUID, reason: str | None) -> Booking:
        booking = await self.bookings.get_by_id(booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        self._check_booking_access(booking, actor)

        if booking.status not in (BookingStatus.CONFIRMED.value, BookingStatus.PENDING_PAYMENT.value):
            raise ConflictError("Booking cannot be cancelled in current state")

        now_utc = datetime.now(timezone.utc)

        def _as_utc(dt: datetime) -> datetime:
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

        if actor.role == UserRole.CUSTOMER.value:
            cutoff = _as_utc(booking.start_at) - timedelta(hours=settings.BOOKING_CANCEL_CUTOFF_HOURS)
            if now_utc >= cutoff:
                raise ConflictError(f"Cancellation window has passed (cutoff: {settings.BOOKING_CANCEL_CUTOFF_HOURS}h before)")
            cancelled_by = CancelledBy.CUSTOMER.value
        elif actor.role == UserRole.BARBER.value:
            if now_utc >= _as_utc(booking.start_at):
                raise ConflictError("Cannot cancel after booking has started")
            cancelled_by = CancelledBy.BARBER.value
        elif actor.role == UserRole.OWNER.value:
            cancelled_by = CancelledBy.OWNER.value
        else:
            cancelled_by = CancelledBy.SYSTEM.value

        before = {"status": booking.status}
        booking.status = BookingStatus.CANCELLED.value
        booking.cancellation_reason = reason
        booking.cancelled_by = cancelled_by
        booking.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "booking.cancel", "booking", booking.id, before, {"status": booking.status})

        from app.tasks.email_tasks import send_booking_cancelled_email
        send_booking_cancelled_email.delay(str(booking.id))

        return booking

    async def update_status(self, actor: User, booking_id: UUID, payload: UpdateBookingStatusIn) -> Booking:
        booking = await self.bookings.get_by_id(booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        if actor.role not in (UserRole.BARBER.value, UserRole.OWNER.value, UserRole.SUPER_ADMIN.value):
            raise ForbiddenError("Not authorized")

        new_status = payload.status.value
        allowed = VALID_TRANSITIONS.get(booking.status, [])
        if new_status not in allowed:
            raise ConflictError(f"Cannot transition from {booking.status} to {new_status}")

        if new_status == BookingStatus.NO_SHOW.value:
            now_utc = datetime.now(timezone.utc)
            start = booking.start_at if booking.start_at.tzinfo else booking.start_at.replace(tzinfo=timezone.utc)
            if now_utc < start:
                raise ConflictError("Cannot mark no-show before booking start time")

        before = {"status": booking.status}
        booking.status = new_status
        booking.updated_at = datetime.now(timezone.utc)
        await self.audit.write(actor.id, actor.role, "booking.status_change", "booking", booking.id, before, {"status": new_status})
        return booking

    def _check_booking_access(self, booking: Booking, actor: User) -> None:
        if actor.role == UserRole.SUPER_ADMIN.value:
            return
        if actor.role == UserRole.CUSTOMER.value and booking.customer_id == actor.id:
            return
        if actor.role == UserRole.BARBER.value and booking.barber_id == actor.id:
            return
        if actor.role == UserRole.OWNER.value:
            return
        raise ForbiddenError("Not authorized to access this booking")

    async def _load_services(self, saloon_id: UUID, service_ids: list[UUID]):
        services = await self.services.get_many_by_ids(service_ids)
        found_ids = {s.id for s in services}
        for sid in service_ids:
            if sid not in found_ids:
                raise NotFoundError(f"Service {sid} not found")
        id_order = {sid: idx for idx, sid in enumerate(service_ids)}
        services.sort(key=lambda s: id_order[s.id])
        for svc in services:
            if str(svc.saloon_id) != str(saloon_id):
                raise ValidationError(f"Service {svc.id} does not belong to this saloon")
            if not svc.is_active:
                raise ValidationError(f"Service {svc.id} is not active")
        return services
