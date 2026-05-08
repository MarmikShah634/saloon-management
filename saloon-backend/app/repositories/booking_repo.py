from datetime import date, datetime
from uuid import UUID
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload
from app.models.booking import Booking, BookingItem
from app.models.enums import BookingStatus
from app.repositories.base import BaseRepository

ACTIVE_STATUSES = (
    BookingStatus.PENDING_PAYMENT.value,
    BookingStatus.CONFIRMED.value,
    BookingStatus.IN_PROGRESS.value,
)


class BookingRepository(BaseRepository[Booking]):
    model = Booking

    async def get_by_id(self, id_: UUID | str) -> Booking | None:
        q = (
            select(Booking)
            .where(Booking.id == id_)
            .options(selectinload(Booking.items))
        )
        return (await self.db.execute(q)).scalar_one_or_none()

    async def list_active_for_barber_on_date(self, barber_id: UUID, day: date) -> list[Booking]:
        q = (
            select(Booking)
            .where(
                Booking.barber_id == barber_id,
                Booking.date == day,
                Booking.status.in_(ACTIVE_STATUSES),
            )
            .order_by(Booking.start_at)
        )
        return list((await self.db.execute(q)).scalars().all())

    async def list_overlapping(self, barber_id: UUID, start: datetime, end: datetime) -> list[Booking]:
        q = select(Booking).where(
            Booking.barber_id == barber_id,
            Booking.status.in_(ACTIVE_STATUSES),
            and_(Booking.start_at < end, Booking.end_at > start),
        )
        return list((await self.db.execute(q)).scalars().all())

    async def list_for_customer(
        self,
        customer_id: UUID,
        status: BookingStatus | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Booking], int]:
        base = (
            select(Booking)
            .where(Booking.customer_id == customer_id)
            .options(selectinload(Booking.items))
        )
        if status:
            base = base.where(Booking.status == status.value)
        if date_from:
            base = base.where(Booking.date >= date_from)
        if date_to:
            base = base.where(Booking.date <= date_to)

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        rows = (
            await self.db.execute(base.order_by(Booking.start_at.desc()).offset((page - 1) * size).limit(size))
        ).scalars().all()
        return list(rows), total

    async def list_for_barber(
        self,
        barber_id: UUID,
        date_from: date | None = None,
        date_to: date | None = None,
        status: BookingStatus | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Booking], int]:
        base = (
            select(Booking)
            .where(Booking.barber_id == barber_id)
            .options(selectinload(Booking.items))
        )
        if status:
            base = base.where(Booking.status == status.value)
        if date_from:
            base = base.where(Booking.date >= date_from)
        if date_to:
            base = base.where(Booking.date <= date_to)

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        rows = (
            await self.db.execute(base.order_by(Booking.start_at.desc()).offset((page - 1) * size).limit(size))
        ).scalars().all()
        return list(rows), total

    async def list_all(
        self,
        saloon_id: UUID | None = None,
        barber_id: UUID | None = None,
        customer_id: UUID | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        status: BookingStatus | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Booking], int]:
        base = select(Booking).options(selectinload(Booking.items))
        if saloon_id:
            base = base.where(Booking.saloon_id == saloon_id)
        if barber_id:
            base = base.where(Booking.barber_id == barber_id)
        if customer_id:
            base = base.where(Booking.customer_id == customer_id)
        if status:
            base = base.where(Booking.status == status.value)
        if date_from:
            base = base.where(Booking.date >= date_from)
        if date_to:
            base = base.where(Booking.date <= date_to)

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        rows = (
            await self.db.execute(base.order_by(Booking.start_at.desc()).offset((page - 1) * size).limit(size))
        ).scalars().all()
        return list(rows), total

    async def count_active_for_barber_on_date(self, barber_id: UUID, day: date) -> int:
        q = select(func.count()).where(
            Booking.barber_id == barber_id,
            Booking.date == day,
            Booking.status.in_(ACTIVE_STATUSES),
        )
        return (await self.db.execute(q)).scalar_one()
