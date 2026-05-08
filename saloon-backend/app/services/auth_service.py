from datetime import datetime, timezone
from uuid import UUID
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AuthError, ConflictError, ValidationError
from app.core.security import hash_password, make_access_token, make_refresh_token, verify_password, decode_token
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.audit_repo import AuditRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import RegisterCustomerIn, LoginIn, TokenPair, RefreshIn, ChangePasswordIn
from app.utils.ids import new_id
from jose import JWTError

REFRESH_BLOCKLIST_PREFIX = "refresh:blocked:"
RESET_TOKEN_PREFIX = "pwd:reset:"


class AuthService:
    def __init__(self, db: AsyncSession, redis: aioredis.Redis | None = None):
        self.db = db
        self.users = UserRepository(db)
        self.audit = AuditRepository(db)
        self.redis = redis

    async def register_customer(self, payload: RegisterCustomerIn) -> User:
        existing = await self.users.get_by_email(payload.email)
        if existing:
            raise ConflictError("Email already registered")

        user = User(
            id=new_id(),
            email=payload.email.lower(),
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            name=payload.name,
            role=UserRole.CUSTOMER.value,
            status="active",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await self.users.add(user)
        await self.audit.write(user.id, UserRole.CUSTOMER.value, "user.create", "user", user.id)
        return user

    async def login(self, payload: LoginIn) -> TokenPair:
        user = await self.users.get_by_email(payload.email)
        if not user or not user.password_hash:
            raise AuthError("Invalid credentials")
        if not verify_password(payload.password, user.password_hash):
            raise AuthError("Invalid credentials")
        if user.status != "active":
            raise AuthError("Account is suspended or inactive")

        access = make_access_token(str(user.id), user.role)
        refresh = make_refresh_token(str(user.id), user.role)
        return TokenPair(
            access_token=access,
            refresh_token=refresh,
            user_id=str(user.id),
            role=user.role,
        )

    async def refresh(self, payload: RefreshIn) -> TokenPair:
        try:
            data = decode_token(payload.refresh_token)
        except JWTError as e:
            raise AuthError("Invalid or expired refresh token") from e
        if data.get("type") != "refresh":
            raise AuthError("Wrong token type")

        if self.redis:
            blocked = await self.redis.get(f"{REFRESH_BLOCKLIST_PREFIX}{payload.refresh_token}")
            if blocked:
                raise AuthError("Token has been revoked")

        user = await self.users.get_by_id(data["sub"])
        if not user or user.status != "active":
            raise AuthError("User not found or inactive")

        access = make_access_token(str(user.id), user.role)
        new_refresh = make_refresh_token(str(user.id), user.role)
        return TokenPair(
            access_token=access,
            refresh_token=new_refresh,
            user_id=str(user.id),
            role=user.role,
        )

    async def logout(self, refresh_token: str) -> None:
        if self.redis:
            try:
                data = decode_token(refresh_token)
                exp = data.get("exp", 0)
                now = int(datetime.now(timezone.utc).timestamp())
                ttl = max(exp - now, 1)
                await self.redis.setex(f"{REFRESH_BLOCKLIST_PREFIX}{refresh_token}", ttl, "1")
            except JWTError:
                pass

    async def forgot_password(self, email: str) -> str | None:
        """Returns a reset token (in production, emails it instead)."""
        user = await self.users.get_by_email(email)
        if not user:
            return None
        import secrets
        token = secrets.token_urlsafe(32)
        if self.redis:
            await self.redis.setex(f"{RESET_TOKEN_PREFIX}{token}", 3600, str(user.id))
        return token

    async def reset_password(self, token: str, new_password: str) -> None:
        if not self.redis:
            raise ValidationError("Password reset not available")
        user_id = await self.redis.get(f"{RESET_TOKEN_PREFIX}{token}")
        if not user_id:
            raise AuthError("Invalid or expired reset token")
        user = await self.users.get_by_id(user_id)
        if not user:
            raise AuthError("User not found")
        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.now(timezone.utc)
        await self.audit.write(user.id, user.role, "user.update", "user", user.id)
        await self.redis.delete(f"{RESET_TOKEN_PREFIX}{token}")

    async def change_password(self, user: User, payload: ChangePasswordIn) -> None:
        if not user.password_hash or not verify_password(payload.old_password, user.password_hash):
            raise AuthError("Current password is incorrect")
        user.password_hash = hash_password(payload.new_password)
        user.updated_at = datetime.now(timezone.utc)
        await self.audit.write(user.id, user.role, "user.update", "user", user.id)
