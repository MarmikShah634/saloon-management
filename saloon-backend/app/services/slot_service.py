from datetime import date, datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.exceptions import NotFoundError
from app.repositories.barber_repo import BarberRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.saloon_repo import SaloonRepository
from app.repositories.service_repo import ServiceRepository
from app.repositories.time_off_repo import TimeOffRepository
from app.repositories.working_hours_repo import WorkingHoursRepository
from app.schemas.slot import SlotOption
from app.utils.time import ceil_to_grid, merge_intervals, subtract_intervals

settings = get_settings()


async def get_slots_for_barber(
    db: AsyncSession,
    barber_id: UUID,
    day: date,
    total_duration_mins: int,
) -> list[SlotOption]:
    barber_repo = BarberRepository(db)
    booking_repo = BookingRepository(db)
    wh_repo = WorkingHoursRepository(db)
    time_off_repo = TimeOffRepository(db)

    barber = await barber_repo.get_by_id(barber_id)
    if not barber or barber.deleted_at or not barber.is_active:
        raise NotFoundError("Barber not found or inactive")

    saloon_repo = SaloonRepository(db)
    saloon = await saloon_repo.get_by_id(barber.saloon_id)
    if not saloon:
        raise NotFoundError("Saloon not found")

    tz = ZoneInfo(saloon.timezone)
    weekday = day.weekday()

    wh_rows = await wh_repo.list_by_barber_weekday(barber_id, weekday)
    if not wh_rows:
        return []

    # Build open windows in UTC
    windows: list[tuple[datetime, datetime]] = []
    for wh in wh_rows:
        w_start = datetime(day.year, day.month, day.day, wh.start_time.hour, wh.start_time.minute, tzinfo=tz).astimezone(timezone.utc)
        w_end = datetime(day.year, day.month, day.day, wh.end_time.hour, wh.end_time.minute, tzinfo=tz).astimezone(timezone.utc)
        windows.append((w_start, w_end))

    # Day boundaries for fetching bookings/time-off
    day_start = datetime(day.year, day.month, day.day, 0, 0, tzinfo=tz).astimezone(timezone.utc)
    day_end = datetime(day.year, day.month, day.day, 23, 59, 59, tzinfo=tz).astimezone(timezone.utc)

    active_bookings = await booking_repo.list_active_for_barber_on_date(barber_id, day)
    buffer = timedelta(minutes=barber.buffer_mins)
    busy_bookings = [(b.start_at, b.end_at + buffer) for b in active_bookings]

    time_offs = await time_off_repo.list_overlapping_day(barber_id, day_start, day_end)
    busy_timeoffs = [(t.start_at, t.end_at) for t in time_offs]

    busy = merge_intervals(busy_bookings + busy_timeoffs)
    free = subtract_intervals(windows, busy)

    step = settings.SLOT_GRID_MINUTES
    duration = timedelta(minutes=total_duration_mins)
    now_utc = datetime.now(timezone.utc)

    results: list[SlotOption] = []
    for w_start, w_end in free:
        t = ceil_to_grid(w_start, step)
        while t + duration <= w_end:
            if t > now_utc:
                results.append(
                    SlotOption(
                        barber_id=barber_id,
                        barber_name=barber.user.name if barber.user else "",
                        start_at=t,
                        end_at=t + duration,
                        duration_mins=total_duration_mins,
                    )
                )
            t += timedelta(minutes=step)

    return results


async def get_slots_for_any_barber(
    db: AsyncSession,
    saloon_id: UUID,
    day: date,
    service_ids: list[UUID],
) -> list[SlotOption]:
    service_repo = ServiceRepository(db)
    barber_repo = BarberRepository(db)
    booking_repo = BookingRepository(db)

    services = await service_repo.get_many_by_ids(service_ids)
    found_ids = {s.id for s in services}
    for sid in service_ids:
        if sid not in found_ids:
            raise NotFoundError(f"Service {sid} not found")
    for svc in services:
        if str(svc.saloon_id) != str(saloon_id):
            raise NotFoundError(f"Service {svc.id} does not belong to this saloon")
        if not svc.is_active:
            raise NotFoundError(f"Service {svc.id} is not active")

    total_duration = sum(s.duration_mins for s in services)

    active_barbers = await barber_repo.list_active_by_saloon(saloon_id)
    service_id_set = set(service_ids)

    # Filter barbers that offer all requested services
    qualified_barbers = []
    for b in active_barbers:
        barber_svc_ids = {bs.service_id for bs in b.barber_services}
        if service_id_set.issubset(barber_svc_ids):
            qualified_barbers.append(b)

    all_slots: list[SlotOption] = []
    barber_loads: dict[UUID, int] = {}

    for barber in qualified_barbers:
        slots = await get_slots_for_barber(db, barber.id, day, total_duration)
        load = await booking_repo.count_active_for_barber_on_date(barber.id, day)
        barber_loads[barber.id] = load
        all_slots.extend(slots)

    # Dedupe by (barber_id, start_at), sort by (start_at, barber_load)
    seen: set[tuple] = set()
    deduped: list[SlotOption] = []
    for slot in all_slots:
        key = (slot.barber_id, slot.start_at)
        if key not in seen:
            seen.add(key)
            deduped.append(slot)

    deduped.sort(key=lambda s: (s.start_at, barber_loads.get(s.barber_id, 0)))
    return deduped
