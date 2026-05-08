import pytest
from app.core.security import hash_password, verify_password, make_access_token, make_refresh_token, decode_token


def test_hash_and_verify():
    pw = "securepassword123"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed)


def test_verify_wrong_password():
    hashed = hash_password("correctpassword")
    assert not verify_password("wrongpassword", hashed)


def test_access_token_decode():
    token = make_access_token("user-123", "customer")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "customer"
    assert payload["type"] == "access"


def test_refresh_token_type():
    token = make_refresh_token("user-456", "owner")
    payload = decode_token(token)
    assert payload["type"] == "refresh"
    assert payload["sub"] == "user-456"


def test_access_token_not_valid_as_refresh():
    token = make_access_token("user-789", "barber")
    payload = decode_token(token)
    assert payload["type"] == "access"
    assert payload["type"] != "refresh"
