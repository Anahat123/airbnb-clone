"""Mock authentication.

There are no passwords: logging in with an email returns a signed token
"<user_id>.<signature>". The signature (HMAC-SHA256 with the server secret) stops
anyone from forging a token for another user id. Real auth is out of scope.
"""

import hashlib
import hmac

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User


def _sign(user_id: int) -> str:
    return hmac.new(settings.secret_key.encode(), str(user_id).encode(), hashlib.sha256).hexdigest()[:32]


def create_token(user_id: int) -> str:
    return f"{user_id}.{_sign(user_id)}"


def _user_id_from_token(token: str) -> int | None:
    user_id, _, signature = token.partition(".")
    if not user_id.isdigit() or not hmac.compare_digest(signature, _sign(int(user_id))):
        return None
    return int(user_id)


def get_optional_user(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    user_id = _user_id_from_token(authorization.removeprefix("Bearer ").strip())
    return db.get(User, user_id) if user_id else None


def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Log in to continue")
    return user


def require_host(user: User = Depends(get_current_user)) -> User:
    if not user.is_host:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Switch to hosting to manage listings")
    return user
