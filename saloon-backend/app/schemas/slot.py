from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class SlotOption(BaseModel):
    barber_id: UUID
    barber_name: str
    start_at: datetime
    end_at: datetime
    duration_mins: int


class SlotsOut(BaseModel):
    items: list[SlotOption]
    total_duration_mins: int
