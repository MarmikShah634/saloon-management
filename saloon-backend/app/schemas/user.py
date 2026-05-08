from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole, UserStatus
from app.schemas.common import ORMBase


class UserOut(ORMBase):
    id: UUID
    email: str
    phone: str | None
    name: str
    role: UserRole
    status: UserStatus
    email_verified_at: datetime | None
    created_at: datetime


class UpdateProfileIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=8, max_length=20)


class UpdateUserStatusIn(BaseModel):
    status: UserStatus
