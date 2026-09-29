import re
from sqlalchemy import select
from app.models import DoNotMergeRule

def get_active_dnm_rules(db, category: str = "*"):
    stmt = select(DoNotMergeRule).where(
        DoNotMergeRule.is_active == True,
        (DoNotMergeRule.category == "*") | (DoNotMergeRule.category == category)
    )
    return list(db.scalars(stmt))


def normalize_attr_val(v):
    if v is None:
        return ""
    s = str(v).strip().lower()
    s = re.sub(r"\b(s\.s\.|stainless steel|ss 304|stainless)\b", "ss304", s)
    s = re.sub(r"\b(carbon steel|c\.s\.)\b", "cs", s)
    s = re.sub(r"\b(cl\s*|class\s*|#\s*)", "", s)
    return s.strip()


def evaluate_do_not_merge(aa: dict, ab: dict, rules: list) -> list[dict]:
    """
    Evaluates attribute maps aa and ab against DoNotMerge rules.
    Returns list of triggered violations.
    """
    violations = []
    for rule in rules:
        if not rule.is_active:
            continue
        
        va = aa.get(rule.attribute_a) or aa.get(rule.attribute_b)
        vb = ab.get(rule.attribute_a) or ab.get(rule.attribute_b)

        if va is None or vb is None:
            continue

        norm_a = normalize_attr_val(va)
        norm_b = normalize_attr_val(vb)

        # Do not block if normalized representations are identical
        if norm_a == norm_b:
            continue

        triggered = False
        if rule.condition in ("DIFFERENT", "VALUE_MISMATCH", "EXPLICIT_BLOCK"):
            triggered = True

        if triggered:
            violations.append({
                "rule_id": str(rule.id),
                "rule_name": rule.name,
                "category": rule.category,
                "attribute": rule.attribute_a,
                "value_a": str(va),
                "value_b": str(vb),
                "severity": rule.severity,
                "reason": f"DO NOT MERGE: {rule.name} triggered. {rule.reason} (Side A: {va}, Side B: {vb})"
            })

    return violations
