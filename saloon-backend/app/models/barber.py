from uuid import UUID
from sqlalchemy import Boolean, CheckConstraint, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class Barber(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "barbers"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    saloon_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("saloons.id", ondelete="CASCADE"), nullable=False
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    buffer_mins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped["User"] = relationship(back_populates="barber")  # type: ignore[name-defined]
    saloon: Mapped["Saloon"] = relationship(back_populates="barbers")  # type: ignore[name-defined]
    working_hours: Mapped[list["BarberWorkingHours"]] = relationship(back_populates="barber", cascade="all, delete-orphan")  # type: ignore[name-defined]
    time_offs: Mapped[list["TimeOff"]] = relationship(back_populates="barber", cascade="all, delete-orphan")  # type: ignore[name-defined]
    barber_services: Mapped[list["BarberService"]] = relationship(back_populates="barber", cascade="all, delete-orphan")  # type: ignore[name-defined]

    __table_args__ = (
        CheckConstraint("buffer_mins >= 0 AND buffer_mins <= 60", name="chk_buffer_mins"),
        Index("idx_barbers_saloon", "saloon_id", postgresql_where="deleted_at IS NULL"),
    )


class BarberService(Base):
    __tablename__ = "barber_services"

    barber_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("barbers.id", ondelete="CASCADE"), primary_key=True
    )
    service_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), primary_key=True
    )

    barber: Mapped["Barber"] = relationship(back_populates="barber_services")
    service: Mapped["Service"] = relationship(back_populates="barber_services")  # type: ignore[name-defined]

    __table_args__ = (Index("idx_bs_service", "service_id"),)
