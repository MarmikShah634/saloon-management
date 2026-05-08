# Saloon Backend — Phase 1

FastAPI async backend for the Saloon Booking Platform.

## Stack

- Python 3.12, FastAPI 0.115, SQLAlchemy 2.0 (async), asyncpg, Alembic
- PostgreSQL 16, Redis 7, Celery 5.4
- Pydantic v2, JWT auth, structlog, slowapi

## Quick Start

### 1. Install dependencies

```bash
poetry install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start services (Docker)

```bash
docker-compose up -d db redis
```

### 4. Run migrations

```bash
alembic upgrade head
```

### 5. Start API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs: http://localhost:8000/api/v1/docs

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://saloon:saloon@localhost:5432/saloon` | Async PG URL |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL |
| `JWT_SECRET` | (required) | JWT signing secret |
| `RESEND_API_KEY` | `""` | Email API key |
| `DEFAULT_TIMEZONE` | `Asia/Kolkata` | Saloon default TZ |
| `SLOT_GRID_MINUTES` | `5` | Slot grid resolution |
| `BOOKING_CANCEL_CUTOFF_HOURS` | `2` | Cancel before start |

## Running Tests

```bash
# Install test dependencies
pip install aiosqlite

# Run all tests
pytest --cov=app tests/

# Run only unit tests
pytest tests/unit/

# Run only integration tests
pytest tests/integration/
```

## Migration Commands

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one
alembic downgrade -1

# Show current revision
alembic current
```

## Running with Docker Compose

```bash
docker-compose up --build
```

This starts: `api` (port 8000), `worker` (Celery), `beat` (Celery Beat), `db` (Postgres 16), `redis` (Redis 7).

## API Overview

All routes under `/api/v1`. Auth via `Authorization: Bearer <token>`.

| Domain | Endpoints |
|---|---|
| Auth | `/auth/register/customer`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password` |
| Users | `/users/me`, `/users/{id}`, `/users` |
| Saloons | `/saloons`, `/saloons/{id}`, `/saloons/{id}/barbers`, `/saloons/{id}/services` |
| Barbers | `/saloons/{id}/barbers`, `/barbers/{id}`, `/barbers/{id}/services`, `/barbers/{id}/working-hours`, `/barbers/{id}/time-off` |
| Services | `/saloons/{id}/services`, `/services/{id}` |
| Slots | `/slots/specific`, `/slots/any` |
| Bookings | `/bookings`, `/bookings/me`, `/bookings/{id}`, `/bookings/{id}/cancel`, `/bookings/{id}/status` |
| Notifications | `/notifications`, `/notifications/{id}/read`, `/notifications/read-all` |
| Analytics | `/analytics/owner/overview`, `/analytics/super-admin/overview` |
| Admin | `/admin/owners`, `/admin/saloons`, `/admin/saloons/{id}/transfer`, `/admin/audit-log` |
