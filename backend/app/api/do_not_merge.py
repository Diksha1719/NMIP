from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import current_user, require
from app.models import DoNotMergeRule
from app.schemas import DoNotMergeRuleInput
from app.rules.do_not_merge import evaluate_do_not_merge
from app.repositories import get, serialize
from app.audit import audit

router = APIRouter(prefix="/api/do-not-merge", dependencies=[Depends(current_user)])


@router.get("/rules")
def list_rules(db: Session = Depends(get_db)):
    rules = db.scalars(select(DoNotMergeRule).order_by(DoNotMergeRule.created_at.desc())).all()
    return [serialize(r) for r in rules]


@router.post("/rules")
def create_rule(payload: DoNotMergeRuleInput, db: Session = Depends(get_db), user=Depends(require("ADMIN", "ENGINEER"))):
    rule = DoNotMergeRule(
        name=payload.name,
        category=payload.category,
        attribute_a=payload.attribute_a,
        attribute_b=payload.attribute_b,
        condition=payload.condition,
        severity=payload.severity,
        reason=payload.reason,
        is_active=payload.is_active,
        created_by=user.id
    )
    db.add(rule)
    db.flush()
    audit(db, user, "DO_NOT_MERGE_RULE_CREATED", rule, new=payload.model_dump(), reason=payload.reason)
    db.commit()
    return serialize(rule)


@router.put("/rules/{rule_id}")
def update_rule(rule_id: UUID, payload: DoNotMergeRuleInput, db: Session = Depends(get_db), user=Depends(require("ADMIN", "ENGINEER"))):
    rule = get(db, DoNotMergeRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    prev = serialize(rule)
    rule.name = payload.name
    rule.category = payload.category
    rule.attribute_a = payload.attribute_a
    rule.attribute_b = payload.attribute_b
    rule.condition = payload.condition
    rule.severity = payload.severity
    rule.reason = payload.reason
    rule.is_active = payload.is_active
    db.flush()
    audit(db, user, "DO_NOT_MERGE_RULE_UPDATED", rule, previous=prev, new=payload.model_dump(), reason="Updated Do Not Merge Rule")
    db.commit()
    return serialize(rule)


@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: UUID, db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    rule = get(db, DoNotMergeRule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    audit(db, user, "DO_NOT_MERGE_RULE_DELETED", rule, previous=serialize(rule), reason="Deleted Do Not Merge Rule")
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted"}


@router.post("/test")
def test_evaluate(payload: dict, db: Session = Depends(get_db)):
    category = payload.get("category", "*")
    aa = payload.get("aa", {})
    ab = payload.get("ab", {})
    stmt = select(DoNotMergeRule).where(
        DoNotMergeRule.is_active == True,
        (DoNotMergeRule.category == "*") | (DoNotMergeRule.category == category)
    )
    rules = list(db.scalars(stmt))
    violations = evaluate_do_not_merge(aa, ab, rules)
    return {"blocked": len(violations) > 0, "violations": violations}
