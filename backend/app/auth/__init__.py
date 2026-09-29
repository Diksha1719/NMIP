from datetime import datetime, timedelta, timezone
from uuid import UUID
import jwt
from fastapi import Depends, HTTPException, Request
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db
from app.config import settings
from app.models import User

password_hash = PasswordHash.recommended()


def token_for(user):
    return jwt.encode({"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(hours=8)}, settings.jwt_secret, algorithm="HS256")


def current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("nmip_session")
    if not token and request.headers.get("authorization", "").startswith("Bearer "):
        token = request.headers["authorization"][7:]
    try:
        payload = jwt.decode(token or "", settings.jwt_secret, algorithms=["HS256"])
        user = db.get(User, UUID(payload["sub"]))
        if not user or not user.is_active:
            raise ValueError()
        # Serialize prototype governance writes across API workers. This also
        # prevents a new rule being inserted between snapshot check and approval.
        if request.method in ("POST", "PUT", "PATCH", "DELETE") and db.bind.dialect.name == "postgresql":
            db.execute(text("SELECT pg_advisory_xact_lock(78764321)"))
        return user
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401, "Please sign in to continue.")


def require(*roles):
    def permission(user: User = Depends(current_user)):
        if user.role not in roles and user.role != "ADMIN":
            raise HTTPException(403, "Your role does not have permission for this action.")
        return user
    return permission
