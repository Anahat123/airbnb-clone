"""Mock auth endpoints: passwordless login/signup, current user, switch to hosting."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import create_token, get_current_user
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_EMAILS = ["guest@demo.com", "priya@demo.com"]


def _auth_response(user: User) -> schemas.AuthResponse:
    return schemas.AuthResponse(token=create_token(user.id), user=schemas.UserMe.model_validate(user))


@router.post("/login", response_model=schemas.AuthResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account with that email. Sign up instead?")
    return _auth_response(user)


@router.post("/signup", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(body: schemas.SignupRequest, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with that email already exists")
    user = User(name=body.name.strip(), email=email)
    db.add(user)
    db.commit()
    return _auth_response(user)


@router.get("/demo-users", response_model=list[schemas.UserMe])
def demo_users(db: Session = Depends(get_db)):
    """Accounts offered as one-click logins in the login modal."""
    users = db.scalars(select(User).where(User.email.in_(DEMO_EMAILS))).all()
    return sorted(users, key=lambda u: DEMO_EMAILS.index(u.email))


@router.get("/me", response_model=schemas.UserMe)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/become-host", response_model=schemas.UserMe)
def become_host(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.is_host = True
    db.commit()
    return user
