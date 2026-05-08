from decimal import Decimal
from uuid import UUID
from sqlalchemy import Boolean, CheckConstraint, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class Service(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "services"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    saloon_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("saloons.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_mins: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    deposit_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("20"))
    category: Mapped[str | None] = mapped_column(String(60), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    saloon: Mapped["Saloon"] = relationship(back_populates="services")  # type: ignore[name-defined]
    barber_services: Mapped[list["BarberService"]] = relationship(back_populates="service")  # type: ignore[name-defined]

    __table_args__ = (
        CheckConstraint("duration_mins > 0 AND duration_mins <= 480", name="chk_duration_mins"),
        CheckConstraint("price >= 0", name="chk_price"),
        CheckConstraint("deposit_pct >= 0 AND deposit_pct <= 100", name="chk_deposit_pct"),
        Index("idx_services_saloon", "saloon_id", postgresql_where="deleted_at IS NULL"),
    )
