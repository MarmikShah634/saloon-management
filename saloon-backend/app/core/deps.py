from typing import Annotated
from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import decode_token
from app.models.enums import UserRole

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
    from app.repositories.user_repo import UserRepository

    user = await UserRepository(db).get_by_id(payload["sub"])
    if not user or user.status != "active":
        raise AuthError("User not found or inactive")
    return user


CurrentUser = Annotated[object, Depends(get_current_user)]


def require_roles(*roles: UserRole):
    async def _guard(user=Depends(get_current_user)):
        if user.role not in [r.value for r in roles]:
            raise ForbiddenError("Insufficient role")
        return user

    return _guard
