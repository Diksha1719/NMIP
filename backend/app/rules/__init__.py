def compare(a: dict, b: dict, rules):
    comparisons = []
    configured = {r.attribute_name: r for r in rules if r.is_active}
    for name in sorted(set(a) | set(b) | set(configured)):
        rule = configured.get(name)
        severity = rule.severity if rule else "IMPORTANT"
        va, vb = a.get(name), b.get(name)
        tolerance = float(rule.rule_definition.get("tolerance", 0)) if rule else 0
        if va is None or vb is None:
            outcome = "MISSING"
        elif str(va).strip().lower() == str(vb).strip().lower():
            outcome = "MATCH"
        elif rule and rule.rule_type == "NUMERIC":
            try:
                outcome = "MATCH" if abs(float(va) - float(vb)) <= tolerance else "CONFLICT"
            except (ValueError, TypeError):
                outcome = "CONFLICT"
        else:
            outcome = "CONFLICT"
        comparisons.append(dict(attribute_name=name, value_a=va, value_b=vb, comparison_result=outcome, criticality=severity, tolerance=tolerance, explanation=f"{name.replace('_', ' ')}: {outcome.lower()} under {'rule v' + str(rule.version) if rule else 'observed attribute comparison'}."))
    return comparisons


def decide(comparisons, has_rules=True, evidence_complete=True, dnm_violations=None):
    if dnm_violations:
        reasons = [v["reason"] for v in dnm_violations]
        return {
            "decision_type": "DO_NOT_MERGE",
            "reason": "DO NOT MERGE ENGINE RULE VIOLATION: " + "; ".join(reasons)
        }
    critical = [c for c in comparisons if c["criticality"] == "CRITICAL"]
    conflicts = [c for c in critical if c["comparison_result"] == "CONFLICT"]
    missing = [c for c in critical if c["comparison_result"] == "MISSING"]
    if conflicts:
        return {"decision_type": "DO_NOT_MERGE", "reason": "Critical engineering conflict: " + ", ".join(c["attribute_name"] for c in conflicts)}
    if not has_rules or not critical or missing or not evidence_complete:
        return {"decision_type": "INSUFFICIENT_INFORMATION", "reason": "Missing critical information, applicable rules or supporting evidence." + (" Required: " + ", ".join(c["attribute_name"] for c in missing) if missing else "")}
    if any(c["comparison_result"] == "MISSING" for c in comparisons):
        return {"decision_type": "INSUFFICIENT_INFORMATION", "reason": "An observed engineering attribute is missing on one source; obtain evidence before identity approval."}
    if any(c["comparison_result"] == "CONFLICT" for c in comparisons):
        return {"decision_type": "POTENTIAL_SUBSTITUTE", "reason": "Critical attributes align but other engineering attributes differ. Functional suitability requires separate engineering approval; this is not identity."}
    return {"decision_type": "IDENTITY_MATCH", "reason": "All configured critical and observed engineering attributes align with source evidence. Human approval is required within this rule scope."}

