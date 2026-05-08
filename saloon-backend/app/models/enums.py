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
    PENDING_PAYMENT = "pending_payment"
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
