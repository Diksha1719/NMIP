import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.config import settings
from app.db import get_db
from app.models import User
from app.schemas import Login
from app.auth import password_hash, token_for, current_user
from app.repositories import serialize
from app.audit import audit
from app.api.catalog import router as catalog
from app.api.admin import router as admin
from app.api.harmonization import router as harmonization
from app.api.do_not_merge import router as do_not_merge
from app.api.taxonomy import router as taxonomy

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db import engine, Base
    import app.models
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="NMIP API", version="1.0.0", description="National Material Intelligence Platform. Synthetic prototype; engineering-governed identity.", lifespan=lifespan)
origins = [x.strip() for x in settings.cors_origins.split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type", "Authorization"])
attempts = defaultdict(deque)
dummy_hash = password_hash.hash("timing-protection-not-an-account")



@app.middleware("http")
async def security(request: Request, call_next):
    if request.method not in ("GET", "HEAD", "OPTIONS") and request.headers.get("origin") and request.headers["origin"] not in origins:
        return JSONResponse({"detail": "Untrusted request origin."}, status_code=403)
    if int(request.headers.get("content-length", "0") or 0) > 11 * 1024 * 1024:
        return JSONResponse({"detail": "Request exceeds upload limit."}, status_code=413)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(IntegrityError)
async def integrity_error(request, exc):
    return JSONResponse({"detail": "A record with this code already exists, or a linked record is invalid."}, status_code=409)


@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    logging.exception("Unhandled API error", exc_info=exc)
    return JSONResponse({"detail": "The request could not be completed. Please try again or contact your administrator."}, status_code=500)


@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: Login, request: Request, response: Response, db: Session = Depends(get_db)):
    key = (request.client.host if request.client else "local", payload.email.lower())
    queue = attempts[key]
    while queue and queue[0] < time.monotonic() - 300:
        queue.popleft()
    if len(queue) >= 10:
        raise HTTPException(429, "Too many login attempts. Try again in five minutes.")
    queue.append(time.monotonic())
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    valid = password_hash.verify(payload.password, user.password_hash if user else dummy_hash)
    if not user or not valid or not user.is_active:
        raise HTTPException(401, "Email or password is incorrect.")
    queue.clear()
    response.set_cookie("nmip_session", token_for(user), httponly=True, secure=settings.cookie_secure, samesite="lax", max_age=28800, path="/")
    audit(db, user, "LOGIN", user, reason="Authenticated with password")
    return serialize(user)


@app.get("/api/auth/me")
def me(user=Depends(current_user)):
    return serialize(user)


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("nmip_session", path="/")
    return {"message": "Signed out"}


app.include_router(catalog)
app.include_router(admin)
app.include_router(harmonization)
app.include_router(do_not_merge)
app.include_router(taxonomy)

