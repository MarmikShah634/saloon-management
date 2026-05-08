from fastapi import APIRouter, Depends, Request, status
from app.core.deps import DbSession, get_current_user
from app.core.rate_limit import limiter
from app.core.redis import get_redis
from app.schemas.auth import (
    ChangePasswordIn,
    ForgotPasswordIn,
    LoginIn,
    RefreshIn,
    RegisterCustomerIn,
    ResetPasswordIn,
    TokenPair,
)
from app.schemas.user import UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/customer", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_customer(payload: RegisterCustomerIn, db: DbSession):
    svc = AuthService(db)
    return await svc.register_customer(payload)


@router.post("/login", response_model=TokenPair)
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginIn, db: DbSession):
    redis = await get_redis()
    svc = AuthService(db, redis)
    return await svc.login(payload)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshIn, db: DbSession):
    redis = await get_redis()
    svc = AuthService(db, redis)
    return await svc.refresh(payload)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: RefreshIn, db: DbSession):
    redis = await get_redis()
    svc = AuthService(db, redis)
    await svc.logout(payload.refresh_token)


@router.get("/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("10/minute")
async def forgot_password(request: Request, payload: ForgotPasswordIn, db: DbSession):
    redis = await get_redis()
    svc = AuthService(db, redis)
    await svc.forgot_password(payload.email)
    return {"message": "If that email exists, a reset link was sent"}


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(payload: ResetPasswordIn, db: DbSession):
    redis = await get_redis()
    svc = AuthService(db, redis)
    await svc.reset_password(payload.token, payload.new_password)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(payload: ChangePasswordIn, db: DbSession, user=Depends(get_current_user)):
    svc = AuthService(db)
    await svc.change_password(user, payload)
