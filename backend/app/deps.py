import uuid

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .security import decode_access_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    subject = decode_access_token(credentials.credentials)
    if subject is None:
        raise HTTPException(401, "Ungültiger oder abgelaufener Token")
    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        raise HTTPException(401, "Ungültiger Token")
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(401, "Benutzer nicht gefunden")
    return user
