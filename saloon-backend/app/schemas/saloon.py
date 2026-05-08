from datetime import time
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.enums import SaloonStatus
from app.schemas.common import ORMBase


class SaloonOut(ORMBase):
    id: UUID
    owner_id: UUID
    name: str
    slug: str
    address: str
    city: str
    lat: Decimal | None
    lng: Decimal | None
    phone: str | None
    photos: list
    default_open: time
    default_close: time
    timezone: str
    status: SaloonStatus
    description: str | None


class CreateSaloonIn(BaseModel):
    owner_id: UUID
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=180, pattern=r"^[a-z0-9-]+$")
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=120)
    lat: Decimal | None = None
    lng: Decimal | None = None
    phone: str | None = Field(default=None, max_length=20)
    default_open: time = time(9, 0)
    default_close: time = time(21, 0)
    timezone: str = "Asia/Kolkata"
    description: str | None = None


class UpdateSaloonIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    address: str | None = Field(default=None, min_length=5, max_length=500)
    city: str | None = Field(default=None, min_length=2, max_length=120)
    lat: Decimal | None = None
    lng: Decimal | None = None
    phone: str | None = Field(default=None, max_length=20)
    default_open: time | None = None
    default_close: time | None = None
    timezone: str | None = None
    description: str | None = None


class UpdateSaloonStatusIn(BaseModel):
    status: SaloonStatus


class AddPhotoIn(BaseModel):
    url: str = Field(min_length=5, max_length=500)
    caption: str | None = Field(default=None, max_length=200)
