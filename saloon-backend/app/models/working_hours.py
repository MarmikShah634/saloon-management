from datetime import datetime, time
from uuid import UUID
from sqlalchemy import CheckConstraint, DateTime, Index, SmallInteger, Time
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class BarberWorkingHours(Base):
    __tablename__ = "barber_working_hours"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    barber_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False
    )
    weekday: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    barber: Mapped["Barber"] = relationship(back_populates="working_hours")  # type: ignore[name-defined]

    __table_args__ = (
        CheckConstraint("weekday BETWEEN 0 AND 6", name="chk_weekday"),
        CheckConstraint("end_time > start_time", name="chk_wh_time"),
        Index("idx_bwh_barber_weekday", "barber_id", "weekday"),
    )
