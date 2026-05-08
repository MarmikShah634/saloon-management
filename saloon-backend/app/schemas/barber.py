from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.schemas.common import ORMBase


class BarberOut(ORMBase):
    id: UUID
    user_id: UUID
    saloon_id: UUID
    bio: str | None
    photo_url: str | None
    buffer_mins: int
    is_active: bool
    name: str | None = None
    email: str | None = None


class CreateBarberIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, min_length=8, max_length=20)
    bio: str | None = None
    photo_url: str | None = None
    buffer_mins: int = Field(default=0, ge=0, le=60)


class UpdateBarberIn(BaseModel):
    bio: str | None = None
    photo_url: str | None = None
    buffer_mins: int | None = Field(default=None, ge=0, le=60)
    is_active: bool | None = None
