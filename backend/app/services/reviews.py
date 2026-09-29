import uuid
from sqlalchemy import select
from fastapi import HTTPException
from app.models import Candidate, Decision, Review, Material, CommonIdentity, LegacyMapping
from app.matching import latest_decision, category_rules
from app.services.materials import attributes
from app.repositories import get
from app.audit import audit


def approve_identity(db, decision, user):
    candidate = get(db, Candidate, decision.candidate_id)
    materials = list(db.scalars(select(Material).where(Material.id.in_([candidate.material_a_id, candidate.material_b_id])).order_by(Material.id).with_for_update()))
    mappings = list(db.scalars(select(LegacyMapping).where(LegacyMapping.material_id.in_([m.id for m in materials]))))
    identities = {m.common_material_id for m in mappings}
    if len(identities) > 1:
        raise HTTPException(409, "Materials belong to separate verified identities; automatic identity consolidation is blocked.")
    identity = get(db, CommonIdentity, next(iter(identities))) if identities else None
    if identity:
        if any(attributes(db, m.id) != identity.canonical_attributes for m in materials):
            raise HTTPException(409, "Canonical attributes differ. A new identity cannot be linked transitively.")
    else:
        category = materials[0].category
        prefix = {"Valves": "VLV", "Bearings": "BRG", "Pumps": "PMP", "Fasteners": "FST", "Electrical": "ELE"}.get(category, "MAT")
        canonical_name = materials[0].normalized_description or materials[0].original_description or "Unspecified Material"
        identity = CommonIdentity(nmip_code=f"NMC-{prefix}-{uuid.uuid4().hex[:12].upper()}", canonical_name=canonical_name, category=category, canonical_attributes=attributes(db, materials[0].id), created_by=user.id)
        db.add(identity)
        audit(db, user, "COMMON_ID_CREATED", identity, new={"code": identity.nmip_code}, reason="Engineer approved an evidenced identity match")
    mapped = {m.material_id for m in mappings}
    for material in materials:
        if material.id not in mapped:
            mapping = LegacyMapping(common_material_id=identity.id, organization_id=material.organization_id, material_id=material.id)
            db.add(mapping)
            audit(db, user, "LEGACY_MAPPING_CREATED", mapping, new={"legacy_code": material.legacy_material_code, "common_id": identity.nmip_code}, reason="Original source code preserved")
        material.status = "VERIFIED"
    return identity


def review(db, payload, user):
    decision = get(db, Decision, payload.decision_id)
    candidate = db.scalar(select(Candidate).where(Candidate.id == decision.candidate_id).with_for_update())
    if candidate.status in ("APPROVED", "REJECTED"):
        raise HTTPException(409, "This recommendation has already been reviewed.")
    locked = {m.id: m for m in db.scalars(select(Material).where(Material.id.in_([candidate.material_a_id, candidate.material_b_id])).order_by(Material.id).with_for_update())}
    a, b = locked[candidate.material_a_id], locked[candidate.material_b_id]
    snapshot = {"a_revision": a.revision, "b_revision": b.revision, "rules": {str(r.id): r.version for r in category_rules(db, a.category)}}
    
    latest = latest_decision(db, candidate.id)
    if not latest or latest.id != decision.id:
        raise HTTPException(409, "A newer decision exists. Rerun the decision before reviewing.")
    
    d_snapshot = decision.snapshot or {}
    if any(d_snapshot.get(k) != v for k, v in snapshot.items()):
        raise HTTPException(409, "Material or rule evidence changed. Rerun the decision before reviewing.")
        
    record = Review(decision_id=decision.id, reviewer_id=user.id, action=payload.action, comment=payload.comment)
    db.add(record)
    identity = None
    if payload.action == "APPROVE" and decision.decision_type == "IDENTITY_MATCH":
        identity = approve_identity(db, decision, user)
    candidate.status = {"APPROVE": "APPROVED", "REJECT": "REJECTED", "REQUEST_INFORMATION": "INFORMATION_REQUESTED"}[payload.action]
    audit(db, user, "ENGINEER_" + payload.action, record, new={"decision": decision.decision_type, "candidate_id": str(candidate.id)}, reason=payload.comment)
    return {"review_id": str(record.id), "status": candidate.status, "common_identity_id": str(identity.id) if identity else None}
