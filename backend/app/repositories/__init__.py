from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.inspection import inspect


def get(db, model, key):
    try:
        value = db.get(model, key if isinstance(key, UUID) else UUID(str(key)))
    except ValueError:
        value = None
    if value is None:
        raise HTTPException(404, "Record not found.")
    return value


def rows(db, model):
    return list(db.scalars(select(model).order_by(model.created_at.desc())))


def serialize(record):
    from fastapi.encoders import jsonable_encoder
    return jsonable_encoder({c.key: getattr(record, c.key) for c in inspect(record).mapper.column_attrs if c.key not in ("password_hash", "embedding", "source_rows")})
