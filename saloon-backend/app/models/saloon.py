from datetime import time
from decimal import Decimal
from uuid import UUID
from sqlalchemy import Index, Numeric, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class Saloon(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "saloons"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    lng: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    photos: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    default_open: Mapped[time] = mapped_column(Time, nullable=False, default=time(9, 0))
    default_close: Mapped[time] = mapped_column(Time, nullable=False, default=time(21, 0))
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Kolkata")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending_approval")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])  # type: ignore[name-defined]
    barbers: Mapped[list["Barber"]] = relationship(back_populates="saloon")  # type: ignore[name-defined]
    services: Mapped[list["Service"]] = relationship(back_populates="saloon")  # type: ignore[name-defined]

    __table_args__ = (
        Index("idx_saloons_city", "city", postgresql_where="deleted_at IS NULL"),
        Index("idx_saloons_status", "status", postgresql_where="deleted_at IS NULL"),
        Index("idx_saloons_geo", "lat", "lng", postgresql_where="deleted_at IS NULL"),
    )
