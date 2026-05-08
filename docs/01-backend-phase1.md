# Saloon Booking Platform — Backend (Phase 1)

> **Repo:** `saloon-backend`
> **Phase:** 1 — Basic Booking (no Google Calendar, no online payments)
> **Stack:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16, Redis 7, Celery
> **Audience:** an engineer or coding agent who must execute, not design. Every decision is made. Follow.

---

## 0. How to Read This Doc

Sections are ordered for execution. Do them top to bottom:
1. Project setup
2. Config + DB + Redis wiring
3. Core utilities (security, deps, exceptions)
4. Models + migrations
5. Schemas
6. Repositories
7. Services (business logic)
8. API routes (per domain)
9. Background tasks
10. Tests
11. Deployment

Do not invent fields, routes, or rules. If something is ambiguous, default to what is written here.

---

## 1. Goals & Non-Negotiables

- All heavy work (slot computation, filtering, search, pagination, aggregation, validation) lives in backend. Frontends are dumb renderers.
- API versioned: every route under `/api/v1`.
- One backend serves all four frontends (customer, barber, owner, super-admin) — role-based, not URL-split.
- Async everywhere: FastAPI async routes, SQLAlchemy async session, asyncpg driver.
- Strict Pydantic schemas at every boundary. No raw `dict` returns from routes.
- Migrations via Alembic only. No manual schema edits.
- All timestamps `timestamptz` in UTC. Convert to saloon timezone only at presentation when explicitly requested.
- All IDs are UUID v7 (or UUID v4 if v7 lib unavailable). Never expose autoincrement integers.
- Soft delete (`deleted_at`) for: `users`, `saloons`, `barbers`, `services`. Hard delete for: `bookings` (never), `booking_items`, `time_off`, `barber_working_hours` (replace not delete logically), `audit_log` (never).
- Every state-changing endpoint writes an `audit_log` row.
- Rate-limit auth + slot endpoints (Redis token bucket).

---

## 2. Tech Stack — Exact Versions

```toml
# pyproject.toml [project] dependencies
python = "^3.12"
fastapi = "^0.115"
uvicorn = { version = "^0.32", extras = ["standard"] }
pydantic = "^2.9"
pydantic-settings = "^2.6"
sqlalchemy = { version = "^2.0.36", extras = ["asyncio"] }
asyncpg = "^0.30"
alembic = "^1.14"
redis = "^5.2"
celery = "^5.4"
python-jose = { version = "^3.3", extras = ["cryptography"] }
passlib = { version = "^1.7", extras = ["bcrypt"] }
python-multipart = "^0.0.12"
email-validator = "^2.2"
httpx = "^0.27"
resend = "^2.4"      # email
python-ulid = "^3.0"
structlog = "^24.4"
slowapi = "^0.1.9"   # rate limiting

# dev
pytest = "^8.3"
pytest-asyncio = "^0.24"
pytest-cov = "^6.0"
ruff = "^0.7"
black = "^24.10"
mypy = "^1.13"
faker = "^33.0"
```

---

## 3. Folder Structure (create exactly this)

```
saloon-backend/
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   ├── redis.py
│   │   ├── celery_app.py
│   │   ├── logging.py
│   │   ├── exceptions.py
│   │   ├── rate_limit.py
│   │   └── deps.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── saloons.py
│   │       ├── barbers.py
│   │       ├── services.py
│   │       ├── working_hours.py
│   │       ├── time_off.py
│   │       ├── slots.py
│   │       ├── bookings.py
│   │       ├── notifications.py
│   │       ├── analytics.py
│   │       └── admin.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── enums.py
│   │   ├── user.py
│   │   ├── saloon.py
│   │   ├── barber.py
│   │   ├── service.py
│   │   ├── working_hours.py
│   │   ├── time_off.py
│   │   ├── booking.py
│   │   ├── notification.py
│   │   └── audit_log.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── saloon.py
│   │   ├── barber.py
│   │   ├── service.py
│   │   ├── working_hours.py
│   │   ├── time_off.py
│   │   ├── slot.py
│   │   ├── booking.py
│   │   ├── notification.py
│   │   └── analytics.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user_repo.py
│   │   ├── saloon_repo.py
│   │   ├── barber_repo.py
│   │   ├── service_repo.py
│   │   ├── working_hours_repo.py
│   │   ├── time_off_repo.py
│   │   ├── booking_repo.py
│   │   └── audit_repo.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── saloon_service.py
│   │   ├── barber_service.py
│   │   ├── service_service.py
│   │   ├── working_hours_service.py
│   │   ├── slot_service.py
│   │   ├── booking_service.py
│   │   ├── notification_service.py
│   │   └── analytics_service.py
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── email_tasks.py
│   │   └── reminder_tasks.py
│   └── utils/
│       ├── __init__.py
│       ├── time.py
│       ├── pagination.py
│       └── ids.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   └── integration/
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
├── alembic.ini
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Environment Variables (`.env.example`)

```
# App
APP_NAME=saloon-backend
APP_ENV=development            # development|staging|production
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8000
APP_BASE_URL=http://localhost:8000
FRONTEND_CUSTOMER_URL=http://localhost:3001
FRONTEND_BARBER_URL=http://localhost:3002
FRONTEND_OWNER_URL=http://localhost:3003
FRONTEND_SUPERADMIN_URL=http://localhost:3004

# Security
JWT_SECRET=change-me-32-bytes-min
JWT_ALGORITHM=HS256
JWT_ACCESS_TTL_MINUTES=30
JWT_REFRESH_TTL_DAYS=30
PASSWORD_MIN_LENGTH=8

# DB
DATABASE_URL=postgresql+asyncpg://saloon:saloon@localhost:5432/saloon
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Email
RESEND_API_KEY=
EMAIL_FROM=noreply@saloon.app

# Rate limit
RATE_LIMIT_AUTH_PER_MIN=10
RATE_LIMIT_SLOTS_PER_MIN=60

# Defaults
DEFAULT_TIMEZONE=Asia/Kolkata
DEFAULT_DEPOSIT_PCT=20
SLOT_GRID_MINUTES=5
BOOKING_CANCEL_CUTOFF_HOURS=2
```

---

## 5. `app/core/config.py`

```python
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    APP_NAME: str = "saloon-backend"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_BASE_URL: str = "http://localhost:8000"

    FRONTEND_CUSTOMER_URL: str
    FRONTEND_BARBER_URL: str
    FRONTEND_OWNER_URL: str
    FRONTEND_SUPERADMIN_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TTL_MINUTES: int = 30
    JWT_REFRESH_TTL_DAYS: int = 30
    PASSWORD_MIN_LENGTH: int = 8

    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    REDIS_URL: str
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

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
```

---

## 6. `app/core/database.py`

```python
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession, async_sessionmaker, create_async_engine
)
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.APP_DEBUG,
)

SessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False, autoflush=False, class_=AsyncSession
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

---

## 7. `app/core/security.py`

```python
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import get_settings

settings = get_settings()
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(p: str) -> str: return _pwd.hash(p)
def verify_password(p: str, h: str) -> bool: return _pwd.verify(p, h)

def _make_token(sub: str, role: str, ttl: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub, "role": role, "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def make_access_token(user_id: str, role: str) -> str:
    return _make_token(user_id, role, timedelta(minutes=settings.JWT_ACCESS_TTL_MINUTES), "access")

def make_refresh_token(user_id: str, role: str) -> str:
    return _make_token(user_id, role, timedelta(days=settings.JWT_REFRESH_TTL_DAYS), "refresh")

def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
```

---

## 8. `app/core/exceptions.py`

```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

class AppError(Exception):
    status_code = 400
    code = "app_error"
    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None, details: dict | None = None):
        super().__init__(message)
        self.message = message
        if code: self.code = code
        if status_code: self.status_code = status_code
        self.details = details or {}

class NotFoundError(AppError):
    status_code = 404; code = "not_found"

class AuthError(AppError):
    status_code = 401; code = "unauthorized"

class ForbiddenError(AppError):
    status_code = 403; code = "forbidden"

class ConflictError(AppError):
    status_code = 409; code = "conflict"

class ValidationError(AppError):
    status_code = 422; code = "validation_error"

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}},
        )
```

All errors returned to clients have shape:
```json
{ "error": { "code": "string", "message": "string", "details": {} } }
```

---

## 9. `app/core/deps.py`

```python
from typing import Annotated
from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import decode_token
from app.models.enums import UserRole
from app.repositories.user_repo import UserRepository

DbSession = Annotated[AsyncSession, Depends(get_db)]

async def get_current_user(
    db: DbSession,
    authorization: str | None = Header(default=None),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError("Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except JWTError as e:
        raise AuthError("Invalid or expired token") from e
    if payload.get("type") != "access":
        raise AuthError("Wrong token type")
    user = await UserRepository(db).get_by_id(payload["sub"])
    if not user or user.status != "active":
        raise AuthError("User not found or inactive")
    return user

CurrentUser = Annotated[object, Depends(get_current_user)]

def require_roles(*roles: UserRole):
    async def _guard(user: CurrentUser):
        if user.role not in roles:
            raise ForbiddenError("Insufficient role")
        return user
    return _guard
```

Use guards in routes:
```python
from app.core.deps import require_roles
from app.models.enums import UserRole

@router.post("/saloons", dependencies=[Depends(require_roles(UserRole.OWNER, UserRole.SUPER_ADMIN))])
```

---

## 10. Models

### 10.1 `app/models/base.py`

```python
from datetime import datetime
from uuid import UUID
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

### 10.2 `app/models/enums.py`

```python
import enum

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    BARBER = "barber"
    OWNER = "owner"
    SUPER_ADMIN = "super_admin"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"

class SaloonStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING_APPROVAL = "pending_approval"

class BookingStatus(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"   # used in P3; in P1 booking goes straight to confirmed
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class CancelledBy(str, enum.Enum):
    CUSTOMER = "customer"
    BARBER = "barber"
    OWNER = "owner"
    SYSTEM = "system"

class AssignedType(str, enum.Enum):
    SPECIFIC = "specific"
    ANY = "any"

class NotificationKind(str, enum.Enum):
    BOOKING_CREATED = "booking_created"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_REMINDER = "booking_reminder"
    BOOKING_RESCHEDULED = "booking_rescheduled"
```

### 10.3 Tables (DDL specified once; ORM mirrors)

#### `users`
```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash TEXT,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer','barber','owner','super_admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
```

#### `saloons`
```sql
CREATE TABLE saloons (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(120) NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  phone VARCHAR(20),
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_open TIME NOT NULL DEFAULT '09:00',
  default_close TIME NOT NULL DEFAULT '21:00',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  status VARCHAR(30) NOT NULL DEFAULT 'pending_approval',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_saloons_city ON saloons(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_saloons_status ON saloons(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_saloons_geo ON saloons(lat, lng) WHERE deleted_at IS NULL;
```

#### `barbers`
```sql
CREATE TABLE barbers (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  saloon_id UUID NOT NULL REFERENCES saloons(id) ON DELETE CASCADE,
  bio TEXT,
  photo_url TEXT,
  buffer_mins INT NOT NULL DEFAULT 0 CHECK (buffer_mins >= 0 AND buffer_mins <= 60),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_barbers_saloon ON barbers(saloon_id) WHERE deleted_at IS NULL;
```

#### `barber_working_hours`
```sql
CREATE TABLE barber_working_hours (
  id UUID PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = Mon
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (end_time > start_time),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bwh_barber_weekday ON barber_working_hours(barber_id, weekday);
```

> Multiple rows per `(barber, weekday)` express lunch breaks. To "delete" a slot → delete the row and re-insert the new set in one transaction.

#### `time_off`
```sql
CREATE TABLE time_off (
  id UUID PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason VARCHAR(200),
  CHECK (end_at > start_at),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_off_barber_range ON time_off(barber_id, start_at, end_at);
```

#### `services`
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  saloon_id UUID NOT NULL REFERENCES saloons(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  duration_mins INT NOT NULL CHECK (duration_mins > 0 AND duration_mins <= 480),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  deposit_pct NUMERIC(5,2) NOT NULL DEFAULT 20 CHECK (deposit_pct >= 0 AND deposit_pct <= 100),
  category VARCHAR(60),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_services_saloon ON services(saloon_id) WHERE deleted_at IS NULL;
```

#### `barber_services`
```sql
CREATE TABLE barber_services (
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);
CREATE INDEX idx_bs_service ON barber_services(service_id);
```

#### `bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id),
  barber_id UUID NOT NULL REFERENCES barbers(id),
  saloon_id UUID NOT NULL REFERENCES saloons(id),
  date DATE NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
  total_price NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_paid BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_type VARCHAR(20) NOT NULL DEFAULT 'specific',
  customer_notes TEXT,
  cancellation_reason TEXT,
  cancelled_by VARCHAR(20),
  google_event_id VARCHAR(120),    -- Phase 2
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX idx_bookings_barber_start ON bookings(barber_id, start_at);
CREATE INDEX idx_bookings_saloon_date ON bookings(saloon_id, date);
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE UNIQUE INDEX uq_bookings_barber_start_active
  ON bookings(barber_id, start_at)
  WHERE status IN ('pending_payment','confirmed','in_progress');
```

#### `booking_items`
```sql
CREATE TABLE booking_items (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  order_index INT NOT NULL,
  price_snapshot NUMERIC(10,2) NOT NULL,
  duration_snapshot INT NOT NULL,
  service_name_snapshot VARCHAR(160) NOT NULL,
  CHECK (end_at > start_at),
  UNIQUE (booking_id, order_index)
);
CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  kind VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at);
```

#### `audit_log`
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id),
  actor_role VARCHAR(20),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  ip VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_user_id);
```

### 10.4 ORM example (`app/models/booking.py`)

```python
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Boolean, Integer, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    customer_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    barber_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("barbers.id"))
    saloon_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("saloons.id"))
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="confirmed", nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    deposit_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    deposit_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assigned_type: Mapped[str] = mapped_column(String(20), default="specific", nullable=False)
    customer_notes: Mapped[str | None] = mapped_column(nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(nullable=True)
    cancelled_by: Mapped[str | None] = mapped_column(String(20), nullable=True)
    google_event_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    items: Mapped[list["BookingItem"]] = relationship(back_populates="booking", cascade="all, delete-orphan", order_by="BookingItem.order_index")
    __table_args__ = (CheckConstraint("end_at > start_at"),)
```

> Mirror this pattern for every other model. Map all columns from DDL. Always specify `timezone=True` on DateTime.

---

## 11. Schemas (Pydantic v2)

### 11.1 `app/schemas/common.py`

```python
from datetime import datetime
from typing import Generic, TypeVar
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")

class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int = Field(ge=1)
    size: int = Field(ge=1, le=100)
    has_next: bool

class PageQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    sort: str | None = None     # "field" or "-field" for desc
    q: str | None = None        # free-text search

class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict = {}

class ErrorResponse(BaseModel):
    error: ErrorBody
```

### 11.2 Auth schemas (`app/schemas/auth.py`)

```python
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole

class RegisterCustomerIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: UserRole

class RefreshIn(BaseModel):
    refresh_token: str
```

### 11.3 Booking schemas (`app/schemas/booking.py`)

```python
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.enums import BookingStatus, AssignedType, CancelledBy
from app.schemas.common import ORMBase

class BookingItemOut(ORMBase):
    id: UUID
    service_id: UUID
    service_name_snapshot: str
    start_at: datetime
    end_at: datetime
    order_index: int
    price_snapshot: Decimal
    duration_snapshot: int

class BookingOut(ORMBase):
    id: UUID
    customer_id: UUID
    barber_id: UUID
    saloon_id: UUID
    date: date
    start_at: datetime
    end_at: datetime
    status: BookingStatus
    total_price: Decimal
    deposit_amount: Decimal
    deposit_paid: bool
    assigned_type: AssignedType
    customer_notes: str | None
    cancellation_reason: str | None
    cancelled_by: CancelledBy | None
    items: list[BookingItemOut]

class CreateBookingIn(BaseModel):
    saloon_id: UUID
    barber_id: UUID | None = None        # None ⇒ "any"
    date: date
    start_at: datetime                    # exact slot start (UTC)
    service_ids: list[UUID] = Field(min_length=1, max_length=10)
    customer_notes: str | None = Field(default=None, max_length=500)

class CancelBookingIn(BaseModel):
    reason: str | None = Field(default=None, max_length=500)
```

> Replicate the `Out`/`In` pattern for every other domain (saloon, barber, service, working hours, time off, slot, notification, analytics). Use `ORMBase` for outputs.

### 11.4 Slot schema (`app/schemas/slot.py`)

```python
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
```

---

## 12. Repositories

### 12.1 `app/repositories/base.py`

```python
from typing import Generic, TypeVar, Type
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base

M = TypeVar("M", bound=Base)

class BaseRepository(Generic[M]):
    model: Type[M]
    def __init__(self, db: AsyncSession): self.db = db
    async def get_by_id(self, id_: UUID | str) -> M | None:
        return await self.db.get(self.model, id_)
    async def add(self, obj: M) -> M:
        self.db.add(obj); await self.db.flush(); return obj
    async def delete(self, obj: M) -> None:
        await self.db.delete(obj); await self.db.flush()
```

### 12.2 `app/repositories/booking_repo.py` (key methods)

```python
from datetime import date, datetime
from uuid import UUID
from sqlalchemy import select, and_, or_
from app.models.booking import Booking
from app.models.enums import BookingStatus
from app.repositories.base import BaseRepository

ACTIVE_STATUSES = (BookingStatus.PENDING_PAYMENT.value, BookingStatus.CONFIRMED.value, BookingStatus.IN_PROGRESS.value)

class BookingRepository(BaseRepository[Booking]):
    model = Booking

    async def list_active_for_barber_on_date(self, barber_id: UUID, day: date) -> list[Booking]:
        q = (
            select(Booking)
            .where(
                Booking.barber_id == barber_id,
                Booking.date == day,
                Booking.status.in_(ACTIVE_STATUSES),
            )
            .order_by(Booking.start_at)
        )
        return list((await self.db.execute(q)).scalars().all())

    async def list_overlapping(self, barber_id: UUID, start: datetime, end: datetime) -> list[Booking]:
        q = select(Booking).where(
            Booking.barber_id == barber_id,
            Booking.status.in_(ACTIVE_STATUSES),
            and_(Booking.start_at < end, Booking.end_at > start),
        )
        return list((await self.db.execute(q)).scalars().all())
```

> Repos hold SQL only. They never call services, never decide policy, never raise domain errors. They return models or `None`.

---

## 13. Slot Service — Authoritative Algorithm

`app/services/slot_service.py`

### 13.1 Public API
```python
async def get_slots_for_barber(
    db: AsyncSession,
    barber_id: UUID,
    day: date,
    total_duration_mins: int,
) -> list[SlotOption]: ...

async def get_slots_for_any_barber(
    db: AsyncSession,
    saloon_id: UUID,
    day: date,
    service_ids: list[UUID],
) -> list[SlotOption]: ...
```

### 13.2 Algorithm (specific barber)

```
INPUT: barber_id, day (date in saloon tz), total_duration_mins

1. Load barber → if inactive or deleted, raise NotFoundError.
2. Load saloon (via barber.saloon_id) → use saloon.timezone.
3. weekday = day.weekday()  # Monday=0
4. Load barber_working_hours rows for (barber_id, weekday). If none → return [].
5. Convert each (start_time, end_time) to absolute timestamptz on `day` in saloon tz, then to UTC.
   These are the open windows W = [(w_start, w_end), ...].
6. Load active bookings overlapping the calendar day (saloon-tz day boundaries → UTC range):
     extend each booking by buffer_mins (barber.buffer_mins) AFTER end.
     Busy_b = [(b.start_at, b.end_at + buffer), ...]
7. Load time_off rows where (start_at, end_at) overlaps day range.
     Busy_t = [(t.start_at, t.end_at), ...]
8. Busy = sort+merge(Busy_b ∪ Busy_t)
9. Free = subtract(Busy from W)
10. Step = settings.SLOT_GRID_MINUTES (default 5).
11. duration = total_duration_mins minutes.
12. results = []
    for window in Free:
        t = ceil_to_grid(window.start, step)
        while t + duration <= window.end:
            results.append(t)
            t += step
13. Drop any t in the past (compare against now() in UTC).
14. For each t, compute end = t + duration, return SlotOption.
```

Helpers:
```python
def ceil_to_grid(dt: datetime, step_min: int) -> datetime:
    minutes = dt.minute
    rem = minutes % step_min
    if rem == 0 and dt.second == 0 and dt.microsecond == 0: return dt
    add = step_min - rem
    return dt.replace(second=0, microsecond=0) + timedelta(minutes=add)
```

`subtract(busy, windows)`: classic interval subtraction. Implement once in `utils/time.py`.

### 13.3 "Any available" algorithm

```
INPUT: saloon_id, day, service_ids[]

1. Load services → all must be active and belong to saloon. Compute total_duration = sum(durations).
2. Load all active barbers in saloon WHERE every service in service_ids is in barber_services.
3. For each such barber: call get_slots_for_barber(...).
4. Merge all SlotOptions, dedupe by (barber_id, start_at), sort by (start_at ASC, barber_load ASC).
   barber_load = count(active bookings of barber on `day`) — cached per request.
5. Return list. Frontend renders earliest options first. If user pre-selected a barber, it should NOT call this endpoint.
```

### 13.4 Booking creation transaction

```
async def create_booking(...):
    async with db.begin():    # transaction
        services = load all services from input.service_ids in saloon
        validate: all active, all belong to saloon, count == len(input.service_ids)
        validate: all assigned to barber (if barber given) OR get_any_barber()

        if barber_id is None:
            slots = get_slots_for_any_barber(saloon_id, day, service_ids)
            chosen = first slot whose start_at == input.start_at
            if not chosen: raise ConflictError("Slot no longer available")
            barber_id = chosen.barber_id
            assigned_type = ANY
        else:
            slots = get_slots_for_barber(barber_id, day, total_duration)
            if input.start_at not in [s.start_at for s in slots]:
                raise ConflictError("Slot no longer available")
            assigned_type = SPECIFIC

        # Lock: SELECT ... FOR UPDATE on bookings where barber_id=... AND date=...
        await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": f"barber:{barber_id}:{day}"})

        # Re-check overlap inside lock
        overlapping = booking_repo.list_overlapping(barber_id, start_at, end_at)
        if overlapping: raise ConflictError("Slot just got taken")

        booking = Booking(...)
        # Compute booking_items: cursor = start_at; for each service in input order:
        #     item.start_at = cursor; cursor += duration; item.end_at = cursor
        # total_price = sum(price_snapshot); deposit_amount = total_price * deposit_pct/100 (using max deposit_pct across services or simply the per-service pct → choose: use saloon-wide DEFAULT_DEPOSIT_PCT for P1 simplicity)
        booking.end_at = cursor
        await booking_repo.add(booking)
        await audit("booking.create", ...)
        # commit on context exit
    enqueue email task: notify customer + barber
    return booking
```

> The `pg_advisory_xact_lock` keyed by `(barber, day)` is the simple, robust race-protection approach. The unique partial index is the safety net.

---

## 14. API Routes — Phase 1 Inventory

All routes are under `/api/v1`. Body = JSON, response = JSON. Auth via `Authorization: Bearer <jwt>` (except where noted).

Format: `METHOD path  — auth/role — purpose`.

### 14.1 Auth (`auth.py`)
```
POST  /auth/register/customer       public                       customer self-signup
POST  /auth/login                   public                       email+password → tokens
POST  /auth/refresh                 public (refresh token in body) → new access+refresh
POST  /auth/logout                  authenticated                 invalidate refresh (Redis blocklist)
GET   /auth/me                      authenticated                 return current user profile
POST  /auth/forgot-password         public                       send reset email
POST  /auth/reset-password          public (token in body)        set new password
POST  /auth/change-password         authenticated                 old + new
```

> Owner, barber, super-admin accounts are NOT self-registered in P1. Owner is created by super-admin; barber is created by owner.

### 14.2 Users (`users.py`)
```
GET    /users/me                    authenticated                 same as /auth/me, kept for symmetry
PATCH  /users/me                    authenticated                 update name/phone
GET    /users/{id}                  super_admin                   read any user
PATCH  /users/{id}/status           super_admin                   suspend/activate user
GET    /users                       super_admin                   list with filters (role, status, q, page)
```

### 14.3 Saloons (`saloons.py`)
```
# Public discovery
GET   /saloons                      public                       list/search (filters below)
GET   /saloons/{id}                 public                       detail
GET   /saloons/{id}/barbers         public                       barbers in saloon
GET   /saloons/{id}/services        public                       services in saloon

# Owner / super-admin
POST   /saloons                     super_admin                  create saloon (assigns owner)
PATCH  /saloons/{id}                owner(self) | super_admin    update
DELETE /saloons/{id}                super_admin                  soft delete
PATCH  /saloons/{id}/status         super_admin                  approve/suspend
POST   /saloons/{id}/photos         owner(self) | super_admin    add photo (URL accepted; upload service later)
DELETE /saloons/{id}/photos/{idx}   owner(self) | super_admin    remove photo
```

Filters for `GET /saloons`:
- `q` — name/city/address ILIKE
- `city` — exact
- `lat`,`lng`,`radius_km` — within radius (PostGIS optional; for P1, approximate with bounding box)
- `service` — only saloons offering service name LIKE
- `sort` — `name`, `-name`, `created_at`, `-created_at`
- `page`, `size`

### 14.4 Barbers (`barbers.py`)
```
POST   /saloons/{saloon_id}/barbers      owner(self saloon)         create barber (also creates user with role=barber, sends invite email with set-password link)
GET    /barbers/{id}                     public                     basic profile
PATCH  /barbers/{id}                     owner | barber(self)       bio/photo/buffer
DELETE /barbers/{id}                     owner                      soft delete
GET    /barbers/{id}/services            public                     services this barber offers
PUT    /barbers/{id}/services            owner | barber(self)       set assigned services (replace list)
GET    /barbers/{id}/working-hours       public                     return list grouped by weekday
PUT    /barbers/{id}/working-hours       owner | barber(self)       replace whole schedule (atomic)
GET    /barbers/{id}/time-off            owner | barber(self)       upcoming time-off
POST   /barbers/{id}/time-off            owner | barber(self)       add
DELETE /time-off/{id}                    owner | barber(self)       remove
GET    /barbers/{id}/bookings            owner | barber(self)       list with filters (date_from, date_to, status)
```

### 14.5 Services (`services.py`)
```
POST   /saloons/{saloon_id}/services     owner(self) | super_admin
GET    /services/{id}                    public
PATCH  /services/{id}                    owner(self) | super_admin
DELETE /services/{id}                    owner(self) | super_admin    soft delete
```

### 14.6 Slots (`slots.py`)
```
GET /slots/specific
  query: barber_id, date (YYYY-MM-DD), service_ids (csv UUIDs)
  auth:  public
  resp:  SlotsOut

GET /slots/any
  query: saloon_id, date, service_ids
  auth:  public
  resp:  SlotsOut
```

Validation:
- `service_ids` non-empty, ≤ 10
- All services belong to same saloon
- date within `[today, today + 60 days]` (config later)

### 14.7 Bookings (`bookings.py`)
```
POST   /bookings                          customer            create
GET    /bookings/me                       customer            list own (filters: status, date_from, date_to, page)
GET    /bookings/{id}                     customer(self) | barber(self) | owner(saloon) | super_admin
PATCH  /bookings/{id}/cancel              customer(self) | barber | owner | super_admin   reason in body
PATCH  /bookings/{id}/status              barber | owner       transitions: confirmed → in_progress → completed; or → no_show
GET    /bookings                          owner(saloon) | super_admin   filters: saloon_id, barber_id, customer_id, date_from, date_to, status, page
```

State machine:
- `confirmed` → `in_progress` (barber)
- `in_progress` → `completed` (barber)
- `confirmed` → `cancelled` (customer ≥ 2h before; barber/owner anytime)
- `confirmed` → `no_show` (barber, only after start_at)
- `pending_payment` exists in schema for P3 future; in P1 always create as `confirmed` immediately.

Cancellation rules (P1):
- Customer can cancel iff `now < start_at - BOOKING_CANCEL_CUTOFF_HOURS`. Else 409.
- Barber/owner/super_admin can cancel anytime up to `start_at`.

### 14.8 Notifications (`notifications.py`)
```
GET   /notifications                authenticated   list mine, paginated, filters: unread_only
POST  /notifications/{id}/read      authenticated
POST  /notifications/read-all       authenticated
```

### 14.9 Analytics (`analytics.py`)
```
GET /analytics/owner/overview        owner(self saloon)
  query: date_from, date_to
  resp:  { bookings_total, bookings_completed, bookings_cancelled, no_shows,
           revenue_estimate, top_services:[{service_id,name,count}],
           top_barbers:[{barber_id,name,bookings_count}],
           daily:[{date,bookings,revenue}] }

GET /analytics/super-admin/overview  super_admin
  query: date_from, date_to
  resp:  { saloons_total, saloons_active, owners_total, customers_total,
           bookings_total, bookings_today, gmv_estimate,
           top_saloons:[{saloon_id,name,bookings_count,gmv}], daily:[{...}] }
```

Revenue in P1 = sum(`bookings.total_price` where status = completed). Replace with payments-based calc in P3.

### 14.10 Admin (`admin.py`)
```
POST   /admin/owners                 super_admin   create owner user (sends invite)
GET    /admin/saloons                super_admin   list with extra fields (owner email, barber count, booking count)
PATCH  /admin/saloons/{id}/transfer  super_admin   change owner_id
GET    /admin/audit-log              super_admin   query audit_log with filters
```

---

## 15. Sample Endpoint — Full Pattern (Bookings POST)

`app/api/v1/bookings.py`

```python
from fastapi import APIRouter, Depends, status
from app.core.deps import DbSession, get_current_user, require_roles
from app.models.enums import UserRole
from app.schemas.booking import BookingOut, CreateBookingIn, CancelBookingIn
from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post(
    "",
    response_model=BookingOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.CUSTOMER))],
)
async def create_booking(payload: CreateBookingIn, db: DbSession, user=Depends(get_current_user)):
    booking = await BookingService(db).create(user_id=user.id, payload=payload)
    return booking

@router.patch("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(booking_id: str, payload: CancelBookingIn, db: DbSession, user=Depends(get_current_user)):
    return await BookingService(db).cancel(actor=user, booking_id=booking_id, reason=payload.reason)
```

`app/services/booking_service.py` (skeleton)

```python
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.repositories.booking_repo import BookingRepository
# ... other repos
from app.services.slot_service import get_slots_for_barber, get_slots_for_any_barber
from app.core.exceptions import ConflictError, NotFoundError, ForbiddenError, ValidationError
from app.schemas.booking import CreateBookingIn

class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.bookings = BookingRepository(db)
        # ...

    async def create(self, *, user_id: UUID, payload: CreateBookingIn):
        async with self.db.begin():  # opens a transaction
            services = await self._load_services(payload.saloon_id, payload.service_ids)
            total_duration = sum(s.duration_mins for s in services)

            if payload.barber_id is None:
                options = await get_slots_for_any_barber(self.db, payload.saloon_id, payload.date, payload.service_ids)
                chosen = next((o for o in options if o.start_at == payload.start_at), None)
                if not chosen: raise ConflictError("Slot no longer available")
                barber_id = chosen.barber_id
                assigned_type = "any"
            else:
                options = await get_slots_for_barber(self.db, payload.barber_id, payload.date, total_duration)
                if not any(o.start_at == payload.start_at for o in options):
                    raise ConflictError("Slot no longer available")
                barber_id = payload.barber_id
                assigned_type = "specific"

            await self.db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": f"barber:{barber_id}:{payload.date}"})

            end_at = payload.start_at + timedelta(minutes=total_duration)
            overlapping = await self.bookings.list_overlapping(barber_id, payload.start_at, end_at)
            if overlapping: raise ConflictError("Slot just got taken")

            # Build booking + items (snapshots), compute totals/deposit, persist
            ...
        # outside transaction → enqueue notifications
        ...
        return booking
```

> Replicate `service → repo → model` pattern for every domain.

---

## 16. Pagination, Filtering, Sorting

- All list endpoints accept `page` (default 1), `size` (default 20, max 100), `sort` (`field` or `-field`), `q` (free-text).
- Pagination response uses `Page[T]` schema. Always returns `total`, `has_next`.
- Filtering done in repositories with explicit `where()` clauses. Allowed filters per endpoint listed in this doc — do not add others without spec change.
- Sorting: whitelist allowed fields per endpoint. Reject others with 422.

`app/utils/pagination.py`
```python
async def paginate(stmt_count, stmt_items, db, page: int, size: int) -> tuple[list, int]:
    offset = (page - 1) * size
    total = (await db.execute(stmt_count)).scalar_one()
    rows = (await db.execute(stmt_items.offset(offset).limit(size))).scalars().all()
    return list(rows), total
```

---

## 17. Notifications

Phase 1 channels: in-app (DB) + email.

- Each notification = one row in `notifications` + one Celery email task.
- Triggers (P1):
  - Booking created → notify customer + barber
  - Booking cancelled → notify the other party
  - 24h before booking → reminder email + in-app for customer
  - 1h before booking → reminder for both

Implement as `NotificationService.dispatch(kind, user_id, ctx)` which:
1. Renders subject/body via Jinja templates in `app/tasks/templates/`.
2. Inserts a `notifications` row.
3. Enqueues Celery email task with rendered subject + body.

Reminder scheduling: a Celery beat job runs every 5 minutes, finds bookings within `[now+55m, now+60m]` (and similarly 23h55m–24h05m) and dispatches reminders idempotently (use a `reminder_sent_24h`, `reminder_sent_1h` boolean OR check existing notifications by kind+entity).

> For idempotency, prefer querying notifications table by `(user_id, kind, data->>'booking_id')` rather than adding flags to bookings.

---

## 18. Audit Log

Every state-changing operation calls `AuditRepository.write(actor, action, entity_type, entity_id, before, after, request)` after success but inside the same transaction.

Actions to log (P1):
- `user.create`, `user.update`, `user.status_change`
- `saloon.create/update/delete/status_change/photo_add/photo_remove/transfer`
- `barber.create/update/delete/services_set/working_hours_set/time_off_add/time_off_remove`
- `service.create/update/delete`
- `booking.create/cancel/status_change`

---

## 19. Rate Limiting

Use `slowapi` with Redis backend.

- `POST /auth/login`, `POST /auth/forgot-password`: `RATE_LIMIT_AUTH_PER_MIN/min` per IP.
- `GET /slots/*`: `RATE_LIMIT_SLOTS_PER_MIN/min` per IP.
- `POST /bookings`: 30/min per user.

Return 429 with standard error envelope.

---

## 20. CORS

In `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 21. `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging

settings = get_settings()
setup_logging()

app = FastAPI(
    title="Saloon Booking API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
register_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health(): return {"status": "ok"}
```

`app/api/v1/router.py`
```python
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
```

---

## 22. Alembic

`alembic.ini` standard. `alembic/env.py` must import `Base.metadata` from `app.models` and use `settings.DATABASE_URL` (sync URL — replace `+asyncpg` with `+psycopg` for migrations or use async migration support).

Initial migration must create everything in §10 plus enums + indexes + unique partial indexes.

Migration policy:
- One migration per PR.
- Migration name: `YYYYMMDD_HHMM_<short>.py`.
- Never edit a merged migration; create a new one.

---

## 23. Docker

`Dockerfile`:
```dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install poetry && poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`docker-compose.yml`: services `api`, `worker` (celery), `beat` (celery beat), `db` (postgres:16), `redis` (redis:7-alpine). Mount volume for db. Env from `.env`.

---

## 24. Testing Requirements (Phase 1)

Mandatory tests:
- Auth: register customer, login, refresh, change password, forgot/reset.
- Saloons: CRUD, list filters, status transitions.
- Barbers: CRUD, working hours replace-atomic, services assign.
- Services: CRUD.
- Slots: 7+ unit tests for `subtract`, `ceil_to_grid`, full-day, no-hours, fully-booked, partial-booked, with-time-off, with-buffer.
- Bookings: create with specific barber, create with any, conflict on duplicate slot (race simulation), cancel rules, state machine, multi-service ordering.
- RBAC: every endpoint tested with wrong role → 403.

Coverage gate: ≥ 85% on `app/services/` and `app/api/v1/`.

---

## 25. Logging & Observability

- `structlog` JSON logs.
- Each request gets `request_id` (UUID4) injected via middleware; included in all log entries and in error response under `details.request_id`.
- Sensitive fields scrubbed (`password`, `password_hash`, `Authorization`).
- Slow query log (>500ms) at WARN.

---

## 26. Definition of Done — Phase 1

- All 5 docs delivered (this is doc 1 of 5).
- Backend repo created with structure in §3.
- All migrations applied, all tables exist with correct constraints + indexes.
- All endpoints in §14 implemented, returning Pydantic schemas, behind correct role guards.
- Slot algorithm passes the 7+ unit tests in §24.
- Booking creation provably race-safe (concurrency test in §24).
- CI runs ruff + black + mypy + pytest with coverage ≥ 85%.
- OpenAPI at `/api/v1/docs` shows every endpoint with descriptions and example responses.
- Health check at `/health`.
- README has: local setup, env vars, migration commands, how to run tests.
