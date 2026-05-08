from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.enums import BookingStatus, AssignedType, CancelledBy
from app.schemas.common import ORMBase


class BookingItemOut(ORMBase):
    id: UUID
    service_id: UUID
    service_name_snapshot: str
    start_at: datetime
    end_at: datetime
    order_index: int
    price_snapshot: Decimal
    duration_snapshot: int


class BookingOut(ORMBase):
    id: UUID
    customer_id: UUID
    barber_id: UUID
    saloon_id: UUID
    date: date
    start_at: datetime
    end_at: datetime
    status: BookingStatus
    total_price: Decimal
    deposit_amount: Decimal
    deposit_paid: bool
    assigned_type: AssignedType
    customer_notes: str | None
    cancellation_reason: str | None
    cancelled_by: CancelledBy | None
    items: list[BookingItemOut]


class CreateBookingIn(BaseModel):
    saloon_id: UUID
    barber_id: UUID | None = None
    date: date
    start_at: datetime
    service_ids: list[UUID] = Field(min_length=1, max_length=10)
    customer_notes: str | None = Field(default=None, max_length=500)


class CancelBookingIn(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class UpdateBookingStatusIn(BaseModel):
    status: BookingStatus
