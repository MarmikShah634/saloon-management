# Saloon Backend — Phase 1

FastAPI async backend for the Saloon Booking Platform.

## Stack

- Python 3.12, FastAPI, SQLAlchemy 2.0 (async), asyncpg, Alembic
- PostgreSQL 16, Redis 7, Celery 5
- Pydantic v2, JWT auth, structlog, slowapi

## Quick Start

### 1. Start infrastructure (Postgres + Redis)

```bash
docker-compose up -d
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, REDIS_URL, JWT_SECRET at minimum
```

### 5. Run migrations

```bash
alembic upgrade head
```

### 6. Start the API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs: http://localhost:8000/api/v1/docs

### 7. Start the Celery worker (separate terminal)

```bash
celery -A app.core.celery_app.celery_app worker --loglevel=info
```

### 8. Start Celery Beat scheduler (separate terminal, optional)

```bash
celery -A app.core.celery_app.celery_app beat --loglevel=info
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://saloon:saloon@localhost:5432/saloon` | Async PostgreSQL URL |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL |
| `CELERY_BROKER_URL` | `redis://localhost:6379/1` | Celery broker |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/2` | Celery results |
| `JWT_SECRET` | (required) | JWT signing secret — set a long random string |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Refresh token TTL |
| `RESEND_API_KEY` | `""` | Resend.com API key for emails |
| `DEFAULT_TIMEZONE` | `Asia/Kolkata` | Saloon default timezone |
| `SLOT_GRID_MINUTES` | `5` | Slot availability grid resolution |
| `BOOKING_CANCEL_CUTOFF_HOURS` | `2` | Hours before start that customer can cancel |

## Running Tests

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest --cov=app tests/

# Unit tests only
pytest tests/unit/

# Integration tests only
pytest tests/integration/
```

> Integration tests use an in-memory SQLite DB — no running Postgres required.

## Migration Commands

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Rollback one step
alembic downgrade -1

# Show current revision
alembic current
```

## API Overview

All routes under `/api/v1/`. Auth via `Authorization: Bearer <token>`.

| Domain | Key endpoints |
|---|---|
| Auth | `/auth/register/customer`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/forgot-password`, `/auth/reset-password` |
| Users | `/users/me`, `/users/{id}`, `/users` |
| Saloons | `/saloons`, `/saloons/{id}`, `/saloons/{id}/barbers`, `/saloons/{id}/services` |
| Barbers | `/barbers/{id}`, `/barbers/{id}/working-hours`, `/barbers/{id}/time-off` |
| Services | `/saloons/{id}/services`, `/services/{id}` |
| Slots | `/slots/specific`, `/slots/any` |
| Bookings | `/bookings`, `/bookings/me`, `/bookings/{id}`, `/bookings/{id}/cancel`, `/bookings/{id}/status` |
| Notifications | `/notifications`, `/notifications/read-all` |
| Analytics | `/analytics/owner/overview`, `/analytics/super-admin/overview` |
| Admin | `/admin/owners`, `/admin/saloons`, `/admin/saloons/{id}/transfer`, `/admin/audit-log` |
