from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, model_validator
from app.schemas.common import ORMBase


class TimeOffOut(ORMBase):
    id: UUID
    barber_id: UUID
    start_at: datetime
    end_at: datetime
    reason: str | None


class CreateTimeOffIn(BaseModel):
    start_at: datetime
    end_at: datetime
    reason: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def check_range(self) -> "CreateTimeOffIn":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self
