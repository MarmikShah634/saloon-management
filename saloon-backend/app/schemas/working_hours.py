from datetime import time
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import ORMBase


class WorkingHoursOut(ORMBase):
    id: UUID
    barber_id: UUID
    weekday: int
    start_time: time
    end_time: time


class WorkingHoursEntryIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time


class SetWorkingHoursIn(BaseModel):
    schedule: list[WorkingHoursEntryIn] = Field(min_length=0, max_length=50)
