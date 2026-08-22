from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..lang import Lang, get_lang, msg
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db), lang: Lang = Depends(get_lang)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(400, msg("email_taken", lang))

    user = models.User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db), lang: Lang = Depends(get_lang)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, msg("bad_credentials", lang))

    return schemas.Token(access_token=create_access_token(subject=str(user.id)))


@router.post("/google", response_model=schemas.Token)
def google_login(
    payload: schemas.GoogleLoginRequest,
    db: Session = Depends(get_db),
    lang: Lang = Depends(get_lang),
):
    """
    Verifies the ID token Google's Identity Services button hands to the
    frontend, then reuses (or creates) a User by email and issues our own
    JWT — everything downstream (get_current_user, per-user data scoping)
    stays exactly the same regardless of how the person signed in.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(501, msg("google_not_configured", lang))

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as err:
        raise HTTPException(401, msg("google_invalid_token", lang)) from err

    email = idinfo.get("email")
    if not email or not idinfo.get("email_verified"):
        raise HTTPException(401, msg("google_unverified_email", lang))

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(email=email, hashed_password=None)
        db.add(user)
        db.commit()
        db.refresh(user)

    return schemas.Token(access_token=create_access_token(subject=str(user.id)))


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
