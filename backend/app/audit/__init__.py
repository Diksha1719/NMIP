from fastapi.encoders import jsonable_encoder
from app.models import AuditLog


def audit(db, user, action, entity, previous=None, new=None, reason=""):
    db.flush()
    db.add(AuditLog(user_id=user.id if user else None, action=action, entity_type=entity.__tablename__, entity_id=str(entity.id), previous_value=jsonable_encoder(previous), new_value=jsonable_encoder(new), reason=reason))
