from datetime import datetime
from uuid import UUID
from sqlalchemy import CheckConstraint, DateTime, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class TimeOff(Base):
    __tablename__ = "time_off"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    barber_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False
    )
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    barber: Mapped["Barber"] = relationship(back_populates="time_offs")  # type: ignore[name-defined]

    __table_args__ = (
        CheckConstraint("end_at > start_at", name="chk_time_off_range"),
        Index("idx_time_off_barber_range", "barber_id", "start_at", "end_at"),
    )
