from datetime import date
from decimal import Decimal
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking, BookingItem
from app.models.barber import Barber
from app.models.enums import BookingStatus, UserRole
from app.models.saloon import Saloon
from app.models.service import Service
from app.models.user import User
from app.schemas.analytics import (
    DailyStats,
    OwnerOverviewOut,
    SuperAdminDailyStats,
    SuperAdminOverviewOut,
    TopBarber,
    TopSaloon,
    TopService,
)


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def owner_overview(self, saloon_id: UUID, date_from: date, date_to: date) -> OwnerOverviewOut:
        base = select(Booking).where(
            Booking.saloon_id == saloon_id,
            Booking.date >= date_from,
            Booking.date <= date_to,
        )

        bookings = list((await self.db.execute(base)).scalars().all())

        total = len(bookings)
        completed = sum(1 for b in bookings if b.status == BookingStatus.COMPLETED.value)
        cancelled = sum(1 for b in bookings if b.status == BookingStatus.CANCELLED.value)
        no_shows = sum(1 for b in bookings if b.status == BookingStatus.NO_SHOW.value)
        revenue = sum(b.total_price for b in bookings if b.status == BookingStatus.COMPLETED.value)

        # Top services
        svc_counts: dict[UUID, dict] = {}
        for booking in bookings:
            items_q = select(BookingItem).where(BookingItem.booking_id == booking.id)
            items = list((await self.db.execute(items_q)).scalars().all())
            for item in items:
                if item.service_id not in svc_counts:
                    svc_counts[item.service_id] = {"name": item.service_name_snapshot, "count": 0}
                svc_counts[item.service_id]["count"] += 1
        top_services = sorted(
            [TopService(service_id=sid, name=v["name"], count=v["count"]) for sid, v in svc_counts.items()],
            key=lambda x: x.count,
            reverse=True,
        )[:10]

        # Top barbers
        barber_counts: dict[UUID, int] = {}
        for booking in bookings:
            barber_counts[booking.barber_id] = barber_counts.get(booking.barber_id, 0) + 1

        top_barbers_list = []
        for bid, cnt in sorted(barber_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            barber = await self.db.get(Barber, bid)
            name = ""
            if barber and barber.user_id:
                user = await self.db.get(User, barber.user_id)
                name = user.name if user else ""
            top_barbers_list.append(TopBarber(barber_id=bid, name=name, bookings_count=cnt))

        # Daily stats
        daily_map: dict[date, dict] = {}
        for booking in bookings:
            d = booking.date
            if d not in daily_map:
                daily_map[d] = {"bookings": 0, "revenue": Decimal("0")}
            daily_map[d]["bookings"] += 1
            if booking.status == BookingStatus.COMPLETED.value:
                daily_map[d]["revenue"] += booking.total_price
        daily = [DailyStats(date=d, bookings=v["bookings"], revenue=v["revenue"]) for d, v in sorted(daily_map.items())]

        return OwnerOverviewOut(
            bookings_total=total,
            bookings_completed=completed,
            bookings_cancelled=cancelled,
            no_shows=no_shows,
            revenue_estimate=Decimal(str(revenue)),
            top_services=top_services,
            top_barbers=top_barbers_list,
            daily=daily,
        )

    async def super_admin_overview(self, date_from: date, date_to: date) -> SuperAdminOverviewOut:
        from datetime import timezone
        from datetime import datetime

        saloons_total = (await self.db.execute(select(func.count()).where(Saloon.deleted_at.is_(None)))).scalar_one()
        saloons_active = (await self.db.execute(select(func.count()).where(Saloon.status == "active", Saloon.deleted_at.is_(None)))).scalar_one()
        owners_total = (await self.db.execute(select(func.count()).where(User.role == UserRole.OWNER.value, User.deleted_at.is_(None)))).scalar_one()
        customers_total = (await self.db.execute(select(func.count()).where(User.role == UserRole.CUSTOMER.value, User.deleted_at.is_(None)))).scalar_one()

        bookings_in_range = list((await self.db.execute(
            select(Booking).where(Booking.date >= date_from, Booking.date <= date_to)
        )).scalars().all())

        today = datetime.now(timezone.utc).date()
        bookings_today = (await self.db.execute(select(func.count()).where(Booking.date == today))).scalar_one()

        bookings_total = len(bookings_in_range)
        gmv = sum(b.total_price for b in bookings_in_range if b.status == BookingStatus.COMPLETED.value)

        saloon_counts: dict[UUID, int] = {}
        saloon_gmv: dict[UUID, Decimal] = {}
        for b in bookings_in_range:
            saloon_counts[b.saloon_id] = saloon_counts.get(b.saloon_id, 0) + 1
            if b.status == BookingStatus.COMPLETED.value:
                saloon_gmv[b.saloon_id] = saloon_gmv.get(b.saloon_id, Decimal("0")) + b.total_price

        top_saloons_list = []
        for sid, cnt in sorted(saloon_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            saloon = await self.db.get(Saloon, sid)
            name = saloon.name if saloon else ""
            top_saloons_list.append(TopSaloon(saloon_id=sid, name=name, bookings_count=cnt, gmv=saloon_gmv.get(sid, Decimal("0"))))

        daily_map: dict[date, dict] = {}
        for b in bookings_in_range:
            d = b.date
            if d not in daily_map:
                daily_map[d] = {"bookings": 0, "revenue": Decimal("0")}
            daily_map[d]["bookings"] += 1
            if b.status == BookingStatus.COMPLETED.value:
                daily_map[d]["revenue"] += b.total_price
        daily = [SuperAdminDailyStats(date=d, bookings=v["bookings"], revenue=v["revenue"]) for d, v in sorted(daily_map.items())]

        return SuperAdminOverviewOut(
            saloons_total=saloons_total,
            saloons_active=saloons_active,
            owners_total=owners_total,
            customers_total=customers_total,
            bookings_total=bookings_total,
            bookings_today=bookings_today,
            gmv_estimate=Decimal(str(gmv)),
            top_saloons=top_saloons_list,
            daily=daily,
        )
