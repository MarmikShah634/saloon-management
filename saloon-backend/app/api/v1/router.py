from fastapi import APIRouter
from app.api.v1 import auth, users, saloons, barbers, services, working_hours, time_off, slots, bookings, notifications, analytics, admin

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(saloons.router)
api_router.include_router(barbers.router)
api_router.include_router(services.router)
api_router.include_router(working_hours.router)
api_router.include_router(time_off.router)
api_router.include_router(slots.router)
api_router.include_router(bookings.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
