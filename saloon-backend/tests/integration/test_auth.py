import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_customer(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register/customer", json={
        "name": "Test User",
        "email": "test@example.com",
        "phone": "9876543210",
        "password": "password123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "customer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "name": "Test User",
        "email": "dup@example.com",
        "phone": "9876543211",
        "password": "password123",
    }
    r1 = await client.post("/api/v1/auth/register/customer", json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/auth/register/customer", json={**payload, "phone": "9876543212"})
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register/customer", json={
        "name": "Login User",
        "email": "login@example.com",
        "phone": "9876543220",
        "password": "mypassword123",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "mypassword123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "customer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register/customer", json={
        "name": "User",
        "email": "user2@example.com",
        "phone": "9876543230",
        "password": "correctpass",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "user2@example.com",
        "password": "wrongpass",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    await client.post("/api/v1/auth/register/customer", json={
        "name": "Me User",
        "email": "me@example.com",
        "phone": "9876543240",
        "password": "password123",
    })
    login = await client.post("/api/v1/auth/login", json={
        "email": "me@example.com",
        "password": "password123",
    })
    token = login.json()["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient):
    await client.post("/api/v1/auth/register/customer", json={
        "name": "PW User",
        "email": "pw@example.com",
        "phone": "9876543250",
        "password": "oldpassword",
    })
    login = await client.post("/api/v1/auth/login", json={
        "email": "pw@example.com",
        "password": "oldpassword",
    })
    token = login.json()["access_token"]
    resp = await client.post(
        "/api/v1/auth/change-password",
        json={"old_password": "oldpassword", "new_password": "newpassword123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 204

    login2 = await client.post("/api/v1/auth/login", json={
        "email": "pw@example.com",
        "password": "newpassword123",
    })
    assert login2.status_code == 200
