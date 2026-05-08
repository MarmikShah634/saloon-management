from app.core.celery_app import celery_app
from app.core.config import get_settings

settings = get_settings()


@celery_app.task(name="app.tasks.email_tasks.send_booking_created_email", bind=True, max_retries=3)
def send_booking_created_email(self, booking_id: str):
    """Send booking confirmation email to customer and barber."""
    try:
        import asyncio
        asyncio.run(_send_booking_created_email(booking_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


async def _send_booking_created_email(booking_id: str):
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.core.database import SessionLocal
    from app.repositories.booking_repo import BookingRepository
    from app.models.user import User

    async with SessionLocal() as db:
        repo = BookingRepository(db)
        booking = await repo.get_by_id(booking_id)
        if not booking:
            return
        customer = await db.get(User, booking.customer_id)
        if customer and settings.RESEND_API_KEY:
            _send_email(
                to=customer.email,
                subject="Booking Confirmed",
                body=f"Your booking for {booking.date} at {booking.start_at.strftime('%H:%M')} is confirmed.",
            )


@celery_app.task(name="app.tasks.email_tasks.send_booking_cancelled_email", bind=True, max_retries=3)
def send_booking_cancelled_email(self, booking_id: str):
    try:
        import asyncio
        asyncio.run(_send_booking_cancelled_email(booking_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


async def _send_booking_cancelled_email(booking_id: str):
    from app.core.database import SessionLocal
    from app.repositories.booking_repo import BookingRepository
    from app.models.user import User

    async with SessionLocal() as db:
        repo = BookingRepository(db)
        booking = await repo.get_by_id(booking_id)
        if not booking:
            return
        customer = await db.get(User, booking.customer_id)
        if customer and settings.RESEND_API_KEY:
            _send_email(
                to=customer.email,
                subject="Booking Cancelled",
                body=f"Your booking for {booking.date} has been cancelled.",
            )


@celery_app.task(name="app.tasks.email_tasks.send_reminder_email", bind=True, max_retries=3)
def send_reminder_email(self, booking_id: str, hours_before: int):
    try:
        import asyncio
        asyncio.run(_send_reminder_email(booking_id, hours_before))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


async def _send_reminder_email(booking_id: str, hours_before: int):
    from app.core.database import SessionLocal
    from app.repositories.booking_repo import BookingRepository
    from app.models.user import User

    async with SessionLocal() as db:
        repo = BookingRepository(db)
        booking = await repo.get_by_id(booking_id)
        if not booking:
            return
        customer = await db.get(User, booking.customer_id)
        if customer and settings.RESEND_API_KEY:
            _send_email(
                to=customer.email,
                subject=f"Reminder: Booking in {hours_before} hour(s)",
                body=f"Reminder: You have a booking on {booking.date} at {booking.start_at.strftime('%H:%M')}.",
            )


def _send_email(to: str, subject: str, body: str) -> None:
    if not settings.RESEND_API_KEY:
        return
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to,
            "subject": subject,
            "text": body,
        })
    except Exception:
        pass
