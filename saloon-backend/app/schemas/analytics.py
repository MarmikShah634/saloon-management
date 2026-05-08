from datetime import date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel


class TopService(BaseModel):
    service_id: UUID
    name: str
    count: int


class TopBarber(BaseModel):
    barber_id: UUID
    name: str
    bookings_count: int


class DailyStats(BaseModel):
    date: date
    bookings: int
    revenue: Decimal


class OwnerOverviewOut(BaseModel):
    bookings_total: int
    bookings_completed: int
    bookings_cancelled: int
    no_shows: int
    revenue_estimate: Decimal
    top_services: list[TopService]
    top_barbers: list[TopBarber]
    daily: list[DailyStats]


class TopSaloon(BaseModel):
    saloon_id: UUID
    name: str
    bookings_count: int
    gmv: Decimal


class SuperAdminDailyStats(BaseModel):
    date: date
    bookings: int
    revenue: Decimal


class SuperAdminOverviewOut(BaseModel):
    saloons_total: int
    saloons_active: int
    owners_total: int
    customers_total: int
    bookings_total: int
    bookings_today: int
    gmv_estimate: Decimal
    top_saloons: list[TopSaloon]
    daily: list[SuperAdminDailyStats]
