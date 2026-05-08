from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    customer_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    barber_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("barbers.id"), nullable=False)
    saloon_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("saloons.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="confirmed", nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    deposit_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"), nullable=False)
    deposit_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assigned_type: Mapped[str] = mapped_column(String(20), default="specific", nullable=False)
    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelled_by: Mapped[str | None] = mapped_column(String(20), nullable=True)
    google_event_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id])  # type: ignore[name-defined]
    barber: Mapped["Barber"] = relationship("Barber", foreign_keys=[barber_id])  # type: ignore[name-defined]
    saloon: Mapped["Saloon"] = relationship("Saloon", foreign_keys=[saloon_id])  # type: ignore[name-defined]
    items: Mapped[list["BookingItem"]] = relationship(
        back_populates="booking", cascade="all, delete-orphan", order_by="BookingItem.order_index"
    )

    __table_args__ = (
        CheckConstraint("end_at > start_at", name="chk_booking_time"),
        Index("idx_bookings_barber_start", "barber_id", "start_at"),
        Index("idx_bookings_saloon_date", "saloon_id", "date"),
        Index("idx_bookings_customer_status", "customer_id", "status"),
    )


class BookingItem(Base):
    __tablename__ = "booking_items"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    booking_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False
    )
    service_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    price_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duration_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    service_name_snapshot: Mapped[str] = mapped_column(String(160), nullable=False)

    booking: Mapped["Booking"] = relationship(back_populates="items")
    service: Mapped["Service"] = relationship("Service")  # type: ignore[name-defined]

    __table_args__ = (
        CheckConstraint("end_at > start_at", name="chk_item_time"),
        Index("idx_booking_items_booking", "booking_id"),
    )
