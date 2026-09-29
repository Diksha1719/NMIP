from collections import Counter
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import current_user, require, password_hash
from app.models import User, EngineeringRule, DictionaryEntry, AuditLog, Material, Candidate, CommonIdentity, Organization, Review, Decision, BenchmarkRun
from app.schemas import RuleInput, UserInput, UserUpdate, DictionaryInput
from app.repositories import get, rows, serialize
from app.matching import latest_decision
from app.audit import audit
from app.ai import embedding_provider
from app.services.ingestion import parse_file, MAX_UPLOAD
from app.services.benchmark import run_benchmark

router = APIRouter(prefix="/api", dependencies=[Depends(current_user)])


@router.get("/analytics/overview")
def overview(db: Session = Depends(get_db)):
    materials, candidates = rows(db, Material), rows(db, Candidate)
    decisions = [latest_decision(db, c.id) for c in candidates]
    distribution = Counter(d.decision_type for d in decisions if d)
    orgs = {o.id: o.code for o in rows(db, Organization)}
    review_records = rows(db, Review)
    turnaround = []
    for r in review_records:
        d = get(db, Decision, r.decision_id)
        turnaround.append(max(0, (r.created_at - d.created_at).total_seconds() / 3600))
    return {"total_materials": len(materials), "common_identities": len(rows(db, CommonIdentity)), "potential_duplicates": distribution["IDENTITY_MATCH"], "pending_reviews": sum(c.status in ("PENDING", "INFORMATION_REQUESTED") for c in candidates), "blocked_merges": distribution["DO_NOT_MERGE"], "insufficient_information": distribution["INSUFFICIENT_INFORMATION"], "organizations": len(orgs), "categories": len({m.category for m in materials}), "duplicate_alerts": len(list(db.scalars(select(AuditLog).where(AuditLog.action == "DUPLICATE_CHECK")))), "decision_distribution": dict(distribution), "by_organization": dict(Counter(orgs[m.organization_id] for m in materials)), "by_category": dict(Counter(m.category for m in materials)), "review_status": dict(Counter(c.status for c in candidates)), "data_quality": {"90–100%": sum(m.data_quality_score >= 90 for m in materials), "50–89%": sum(50 <= m.data_quality_score < 90 for m in materials), "Below 50%": sum(m.data_quality_score < 50 for m in materials)}, "duplicate_trends": dict(sorted(Counter(c.created_at.date().isoformat() for c in candidates).items())), "average_quality": round(sum(m.data_quality_score for m in materials) / max(1, len(materials)), 1), "review_turnaround_hours": round(sum(turnaround) / len(turnaround), 2) if turnaround else None, "recent_activity": [{**serialize(a), "user_name": get(db, User, a.user_id).name if a.user_id else "System"} for a in rows(db, AuditLog)[:10]], "provider": embedding_provider.name, "data_notice": "Synthetic demonstration data"}


@router.get("/audit")
def audit_list(db: Session = Depends(get_db)):
    return [{**serialize(a), "user_name": get(db, User, a.user_id).name if a.user_id else "System"} for a in rows(db, AuditLog)[:1000]]


@router.get("/rules")
def rules(db: Session = Depends(get_db)):
    return [serialize(r) for r in rows(db, EngineeringRule)]


def check_rule(payload):
    try:
        tolerance = float(payload.rule_definition.get("tolerance", 0))
        if tolerance < 0 or tolerance != tolerance or tolerance == float("inf"):
            raise ValueError()
    except (TypeError, ValueError):
        raise HTTPException(422, "Rule tolerance must be a finite nonnegative number.")


@router.post("/rules", status_code=201)
def create_rule(payload: RuleInput, db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    check_rule(payload)
    if db.scalar(select(EngineeringRule).where(EngineeringRule.category == payload.category, EngineeringRule.attribute_name == payload.attribute_name)):
        raise HTTPException(409, "A rule for this category and attribute already exists; edit it to create a new version.")
    rule = EngineeringRule(**payload.model_dump())
    db.add(rule)
    audit(db, user, "RULE_CREATED", rule, new=payload.model_dump(), reason="Admin-configured category rule")
    return serialize(rule)


@router.put("/rules/{id}")
def update_rule(id: UUID, payload: RuleInput, db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    check_rule(payload)
    rule = get(db, EngineeringRule, id)
    if payload.category != rule.category or payload.attribute_name != rule.attribute_name:
        raise HTTPException(422, "Create a new rule to change its category or attribute.")
    previous = serialize(rule)
    for key, value in payload.model_dump().items():
        setattr(rule, key, value)
    rule.version += 1
    audit(db, user, "RULE_UPDATED", rule, previous=previous, new=serialize(rule), reason="Previous decisions require reevaluation before approval")
    return serialize(rule)


@router.get("/users")
def users(db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    return [serialize(u) for u in rows(db, User)]


@router.post("/users", status_code=201)
def create_user(payload: UserInput, db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    if payload.organization_id:
        get(db, Organization, payload.organization_id)
    record = User(**payload.model_dump(exclude={"password"}), password_hash=password_hash.hash(payload.password))
    db.add(record)
    audit(db, user, "USER_CREATED", record, new={"email": record.email, "role": record.role}, reason="Administrator provisioning")
    return serialize(record)


@router.put("/users/{id}")
def update_user(id: UUID, payload: UserUpdate, db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    record = get(db, User, id)
    if record.id == user.id:
        raise HTTPException(409, "You cannot change your own access.")
    previous = serialize(record)
    record.role, record.is_active = payload.role, payload.is_active
    audit(db, user, "USER_UPDATED", record, previous=previous, new=serialize(record), reason="Administrator access management")
    return serialize(record)


@router.get("/settings")
def settings_view(db: Session = Depends(get_db)):
    return {"embedding_provider": embedding_provider.name, "extraction_provider": "Deterministic rules with evidence; no external LLM configured", "dictionary": [serialize(d) for d in rows(db, DictionaryEntry)], "max_upload_mb": 10, "erp_sync": "JSON export available; no external ERP configured"}


@router.post("/settings/dictionary")
def dictionary(payload: DictionaryInput, db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    entry = db.scalar(select(DictionaryEntry).where(DictionaryEntry.term == payload.term))
    previous = serialize(entry) if entry else None
    if entry:
        for key, value in payload.model_dump().items():
            setattr(entry, key, value)
        entry.version += 1
    else:
        entry = DictionaryEntry(**payload.model_dump())
        db.add(entry)
    audit(db, user, "DICTIONARY_UPDATED", entry, previous=previous, new=payload.model_dump(), reason="Explicit terminology mapping; reprocess unverified materials to apply")
    return serialize(entry)


@router.get("/proof-board")
def proof(db: Session = Depends(get_db)):
    runs = rows(db, BenchmarkRun)
    return {"status": "Complete" if runs else "Awaiting benchmark dataset", "runs": [serialize(r) for r in runs], "provider": embedding_provider.name}


@router.post("/proof-board/benchmark")
async def benchmark(file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(require("ENGINEER"))):
    data = parse_file(file.filename or "", await file.read(MAX_UPLOAD + 1))
    if len(data) > 1000:
        raise HTTPException(422, "Use up to 1,000 labeled pairs for this synchronous prototype.")
    result = BenchmarkRun(uploaded_by=user.id, filename=(file.filename or "benchmark")[:250], row_count=len(data), metrics=run_benchmark(db, data))
    db.add(result)
    audit(db, user, "BENCHMARK_COMPLETED", result, new={"rows": len(data)}, reason="Metrics computed from uploaded labels")
    return serialize(result)
