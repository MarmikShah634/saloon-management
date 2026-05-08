from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    APP_NAME: str = "saloon-backend"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_BASE_URL: str = "http://localhost:8000"

    FRONTEND_CUSTOMER_URL: str = "http://localhost:3001"
    FRONTEND_BARBER_URL: str = "http://localhost:3002"
    FRONTEND_OWNER_URL: str = "http://localhost:3003"
    FRONTEND_SUPERADMIN_URL: str = "http://localhost:3004"

    JWT_SECRET: str = "change-me-32-bytes-min-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TTL_MINUTES: int = 30
    JWT_REFRESH_TTL_DAYS: int = 30
    PASSWORD_MIN_LENGTH: int = 8

    DATABASE_URL: str = "postgresql+asyncpg://saloon:saloon@localhost:5432/saloon"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@saloon.app"

    RATE_LIMIT_AUTH_PER_MIN: int = 10
    RATE_LIMIT_SLOTS_PER_MIN: int = 60

    DEFAULT_TIMEZONE: str = "Asia/Kolkata"
    DEFAULT_DEPOSIT_PCT: float = 20.0
    SLOT_GRID_MINUTES: int = 5
    BOOKING_CANCEL_CUTOFF_HOURS: int = 2

    @property
    def cors_origins(self) -> list[str]:
        return [
            self.FRONTEND_CUSTOMER_URL,
            self.FRONTEND_BARBER_URL,
            self.FRONTEND_OWNER_URL,
            self.FRONTEND_SUPERADMIN_URL,
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
