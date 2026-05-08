from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import ORMBase


class ServiceOut(ORMBase):
    id: UUID
    saloon_id: UUID
    name: str
    description: str | None
    duration_mins: int
    price: Decimal
    deposit_pct: Decimal
    category: str | None
    is_active: bool


class CreateServiceIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None
    duration_mins: int = Field(gt=0, le=480)
    price: Decimal = Field(ge=0)
    deposit_pct: Decimal = Field(default=Decimal("20"), ge=0, le=100)
    category: str | None = Field(default=None, max_length=60)
    is_active: bool = True


class UpdateServiceIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = None
    duration_mins: int | None = Field(default=None, gt=0, le=480)
    price: Decimal | None = Field(default=None, ge=0)
    deposit_pct: Decimal | None = Field(default=None, ge=0, le=100)
    category: str | None = Field(default=None, max_length=60)
    is_active: bool | None = None
