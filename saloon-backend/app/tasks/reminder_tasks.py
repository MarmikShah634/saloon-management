from datetime import datetime, timedelta, timezone
from app.core.celery_app import celery_app


@celery_app.task(name="app.tasks.reminder_tasks.send_reminders")
def send_reminders():
    """Check for upcoming bookings and send reminders idempotently."""
    import asyncio
    asyncio.run(_send_reminders())


async def _send_reminders():
    from sqlalchemy import select, and_
    from app.core.database import SessionLocal
    from app.models.booking import Booking
    from app.models.enums import BookingStatus, NotificationKind
    from app.models.notification import Notification
    from app.services.notification_service import NotificationService
    from app.tasks.email_tasks import send_reminder_email

    now = datetime.now(timezone.utc)

    windows = [
        (timedelta(minutes=55), timedelta(minutes=65), 1),
        (timedelta(hours=23, minutes=55), timedelta(hours=24, minutes=5), 24),
    ]

    async with SessionLocal() as db:
        async with db.begin():
            svc = NotificationService(db)
            for delta_min, delta_max, hours in windows:
                window_start = now + delta_min
                window_end = now + delta_max
                q = select(Booking).where(
                    Booking.status.in_([BookingStatus.CONFIRMED.value]),
                    Booking.start_at >= window_start,
                    Booking.start_at < window_end,
                )
                bookings = list((await db.execute(q)).scalars().all())
                for booking in bookings:
                    kind = NotificationKind.BOOKING_REMINDER.value
                    exists_q = select(Notification).where(
                        Notification.user_id == booking.customer_id,
                        Notification.kind == kind,
                        Notification.data["booking_id"].astext == str(booking.id),
                        Notification.data["hours_before"].astext == str(hours),
                    )
                    existing = (await db.execute(exists_q)).scalar_one_or_none()
                    if not existing:
                        await svc.dispatch(
                            NotificationKind.BOOKING_REMINDER,
                            booking.customer_id,
                            title=f"Reminder: Booking in {hours} hour(s)",
                            body=f"You have a booking on {booking.date} at {booking.start_at.strftime('%H:%M')}.",
                            data={"booking_id": str(booking.id), "hours_before": str(hours)},
                        )
                        send_reminder_email.delay(str(booking.id), hours)
