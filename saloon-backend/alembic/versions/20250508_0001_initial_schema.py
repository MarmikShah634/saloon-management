"""Initial schema

Revision ID: 001
Revises:
Create Date: 2025-05-08 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("password_hash", sa.Text, nullable=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("phone", name="uq_users_phone"),
        sa.CheckConstraint("role IN ('customer','barber','owner','super_admin')", name="chk_users_role"),
    )
    op.create_index("idx_users_role", "users", ["role"], postgresql_where=sa.text("deleted_at IS NULL"))

    op.create_table(
        "saloons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("slug", sa.String(180), nullable=False),
        sa.Column("address", sa.Text, nullable=False),
        sa.Column("city", sa.String(120), nullable=False),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lng", sa.Numeric(9, 6), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("photos", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("default_open", sa.Time, nullable=False, server_default="09:00"),
        sa.Column("default_close", sa.Time, nullable=False, server_default="21:00"),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="Asia/Kolkata"),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending_approval"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("slug", name="uq_saloons_slug"),
    )
    op.create_index("idx_saloons_city", "saloons", ["city"], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("idx_saloons_status", "saloons", ["status"], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("idx_saloons_geo", "saloons", ["lat", "lng"], postgresql_where=sa.text("deleted_at IS NULL"))

    op.create_table(
        "barbers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("saloon_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("saloons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("photo_url", sa.Text, nullable=True),
        sa.Column("buffer_mins", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", name="uq_barbers_user_id"),
        sa.CheckConstraint("buffer_mins >= 0 AND buffer_mins <= 60", name="chk_buffer_mins"),
    )
    op.create_index("idx_barbers_saloon", "barbers", ["saloon_id"], postgresql_where=sa.text("deleted_at IS NULL"))

    op.create_table(
        "barber_working_hours",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("barber_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("weekday", sa.SmallInteger, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("end_time", sa.Time, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("weekday BETWEEN 0 AND 6", name="chk_weekday"),
        sa.CheckConstraint("end_time > start_time", name="chk_wh_time"),
    )
    op.create_index("idx_bwh_barber_weekday", "barber_working_hours", ["barber_id", "weekday"])

    op.create_table(
        "time_off",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("barber_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("barbers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reason", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("end_at > start_at", name="chk_time_off_range"),
    )
    op.create_index("idx_time_off_barber_range", "time_off", ["barber_id", "start_at", "end_at"])

    op.create_table(
        "services",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("saloon_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("saloons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("duration_mins", sa.Integer, nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("deposit_pct", sa.Numeric(5, 2), nullable=False, server_default="20"),
        sa.Column("category", sa.String(60), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("duration_mins > 0 AND duration_mins <= 480", name="chk_duration_mins"),
        sa.CheckConstraint("price >= 0", name="chk_price"),
        sa.CheckConstraint("deposit_pct >= 0 AND deposit_pct <= 100", name="chk_deposit_pct"),
    )
    op.create_index("idx_services_saloon", "services", ["saloon_id"], postgresql_where=sa.text("deleted_at IS NULL"))

    op.create_table(
        "barber_services",
        sa.Column("barber_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("barbers.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_index("idx_bs_service", "barber_services", ["service_id"])

    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("barber_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("barbers.id"), nullable=False),
        sa.Column("saloon_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("saloons.id"), nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="confirmed"),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("deposit_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("deposit_paid", sa.Boolean, nullable=False, server_default=sa.text("FALSE")),
        sa.Column("assigned_type", sa.String(20), nullable=False, server_default="specific"),
        sa.Column("customer_notes", sa.Text, nullable=True),
        sa.Column("cancellation_reason", sa.Text, nullable=True),
        sa.Column("cancelled_by", sa.String(20), nullable=True),
        sa.Column("google_event_id", sa.String(120), nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("end_at > start_at", name="chk_booking_time"),
    )
    op.create_index("idx_bookings_barber_start", "bookings", ["barber_id", "start_at"])
    op.create_index("idx_bookings_saloon_date", "bookings", ["saloon_id", "date"])
    op.create_index("idx_bookings_customer_status", "bookings", ["customer_id", "status"])
    op.create_index(
        "uq_bookings_barber_start_active",
        "bookings",
        ["barber_id", "start_at"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending_payment','confirmed','in_progress')"),
    )

    op.create_table(
        "booking_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("order_index", sa.Integer, nullable=False),
        sa.Column("price_snapshot", sa.Numeric(10, 2), nullable=False),
        sa.Column("duration_snapshot", sa.Integer, nullable=False),
        sa.Column("service_name_snapshot", sa.String(160), nullable=False),
        sa.CheckConstraint("end_at > start_at", name="chk_item_time"),
        sa.UniqueConstraint("booking_id", "order_index", name="uq_booking_item_order"),
    )
    op.create_index("idx_booking_items_booking", "booking_items", ["booking_id"])

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("data", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_notifications_user_unread", "notifications", ["user_id", "read_at"])

    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("actor_role", sa.String(20), nullable=True),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("entity_type", sa.String(40), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("before", postgresql.JSONB, nullable=True),
        sa.Column("after", postgresql.JSONB, nullable=True),
        sa.Column("ip", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_audit_entity", "audit_log", ["entity_type", "entity_id"])
    op.create_index("idx_audit_actor", "audit_log", ["actor_user_id"])


def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("notifications")
    op.drop_table("booking_items")
    op.drop_table("bookings")
    op.drop_table("barber_services")
    op.drop_table("services")
    op.drop_table("time_off")
    op.drop_table("barber_working_hours")
    op.drop_table("barbers")
    op.drop_table("saloons")
    op.drop_table("users")
