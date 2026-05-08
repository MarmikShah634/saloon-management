"""Integration tests for booking flow."""
import pytest
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.saloon import Saloon
from app.models.barber import Barber, BarberService
from app.models.service import Service
from app.models.working_hours import BarberWorkingHours
from app.models.enums import SaloonStatus, UserRole
from app.core.security import hash_password, make_access_token
from app.utils.ids import new_id


async def create_test_data(db: AsyncSession):
    """Create minimal data for booking tests."""
    from datetime import time

    # Customer
    customer = User(
        id=new_id(), email="customer@test.com", name="Customer",
        role=UserRole.CUSTOMER.value, status="active",
        password_hash=hash_password("password"),
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    db.add(customer)

    # Owner
    owner = User(
        id=new_id(), email="owner@test.com", name="Owner",
        role=UserRole.OWNER.value, status="active",
        password_hash=hash_password("password"),
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    db.add(owner)

    # Saloon
    saloon = Saloon(
        id=new_id(), owner_id=owner.id, name="Test Saloon",
        slug="test-saloon", address="123 Test St", city="TestCity",
        photos=[], default_open=time(9, 0), default_close=time(21, 0),
        timezone="UTC", status=SaloonStatus.ACTIVE.value,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    db.add(saloon)

    # Barber user
    barber_user = User(
        id=new_id(), email="barber@test.com", name="Barber Bob",
        role=UserRole.BARBER.value, status="active",
        password_hash=hash_password("password"),
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    db.add(barber_user)

    # Barber
    barber = Barber(
        id=new_id(), user_id=barber_user.id, saloon_id=saloon.id,
        buffer_mins=0, is_active=True,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    db.add(barber)

    # Service
    service = Service(
        id=new_id(), saloon_id=saloon.id, name="Haircut",
        duration_mins=30, price=500, deposit_pct=20, is_active=True,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    db.add(service)

    # Barber <-> Service link
    db.add(BarberService(barber_id=barber.id, service_id=service.id))

    # Working hours for all 7 days (9-17 UTC) so tests work on any day
    for weekday in range(7):
        wh = BarberWorkingHours(
            id=new_id(), barber_id=barber.id, weekday=weekday,
            start_time=time(9, 0), end_time=time(17, 0),
            created_at=datetime.now(timezone.utc),
        )
        db.add(wh)

    await db.flush()
    return customer, barber, saloon, service


@pytest.mark.asyncio
async def test_create_booking_specific_barber(client: AsyncClient, db_session: AsyncSession):
    customer, barber, saloon, service = await create_test_data(db_session)
    await db_session.commit()

    token = make_access_token(str(customer.id), UserRole.CUSTOMER.value)

    # Use tomorrow at 10:00 AM UTC — always in the future and within working hours
    tomorrow = date.today() + timedelta(days=1)
    start_at = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 10, 0, tzinfo=timezone.utc)

    resp = await client.post(
        "/api/v1/bookings",
        json={
            "saloon_id": str(saloon.id),
            "barber_id": str(barber.id),
            "date": tomorrow.isoformat(),
            "start_at": start_at.isoformat(),
            "service_ids": [str(service.id)],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "confirmed"
    assert data["barber_id"] == str(barber.id)
    assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_cancel_booking_as_customer(client: AsyncClient, db_session: AsyncSession):
    customer, barber, saloon, service = await create_test_data(db_session)
    await db_session.commit()

    token = make_access_token(str(customer.id), UserRole.CUSTOMER.value)

    # Use tomorrow at 10:00 AM UTC — well past the 2h cancellation cutoff
    tomorrow = date.today() + timedelta(days=1)
    start_at = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 10, 0, tzinfo=timezone.utc)

    create_resp = await client.post(
        "/api/v1/bookings",
        json={
            "saloon_id": str(saloon.id),
            "barber_id": str(barber.id),
            "date": tomorrow.isoformat(),
            "start_at": start_at.isoformat(),
            "service_ids": [str(service.id)],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_resp.status_code == 201
    booking_id = create_resp.json()["id"]

    cancel_resp = await client.patch(
        f"/api/v1/bookings/{booking_id}/cancel",
        json={"reason": "Changed my mind"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_wrong_role_cannot_create_booking(client: AsyncClient, db_session: AsyncSession):
    _, barber, saloon, service = await create_test_data(db_session)
    # Use barber token for booking (should fail - only customer can book)
    barber_user_id = barber.user_id
    token = make_access_token(str(barber_user_id), UserRole.BARBER.value)
    tomorrow = date.today() + timedelta(days=1)
    start_at = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 10, 0, tzinfo=timezone.utc)

    resp = await client.post(
        "/api/v1/bookings",
        json={
            "saloon_id": str(saloon.id),
            "barber_id": str(barber.id),
            "date": tomorrow.isoformat(),
            "start_at": start_at.isoformat(),
            "service_ids": [str(service.id)],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
