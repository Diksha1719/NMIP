from rapidfuzz.fuzz import token_sort_ratio
from sqlalchemy import select, or_
from app.models import Material, Candidate, Decision, Comparison, EngineeringRule, MaterialAttribute, DictionaryEntry, LegacyMapping, CommonIdentity
from app.services.materials import attributes
from app.ai import embedding_provider, extraction_provider
from app.rules import compare, decide
from app.rules.do_not_merge import get_active_dnm_rules, evaluate_do_not_merge
from app.audit import audit


def category_rules(db, category):
    return list(db.scalars(select(EngineeringRule).where(EngineeringRule.category == category, EngineeringRule.is_active == True)))


def scores(a, b, av, bv):
    fuzzy = token_sort_ratio(a, b)
    cosine = max(0, sum(x * y for x, y in zip(av, bv))) * 100
    return round(cosine, 2), round(fuzzy, 2)


def evaluate(db, candidate, user):
    a, b = db.get(Material, candidate.material_a_id), db.get(Material, candidate.material_b_id)
    rules = category_rules(db, a.category)
    aa, ab = attributes(db, a.id), attributes(db, b.id)
    comparisons = compare(aa, ab, rules)

    # Evaluate Do Not Merge Rules
    dnm_rules = get_active_dnm_rules(db, a.category)
    dnm_violations = evaluate_do_not_merge(aa, ab, dnm_rules)

    required = {r.attribute_name for r in rules if r.severity == "CRITICAL"}
    supported, evidence_snapshot = [], []
    for m in (a, b):
        attrs = list(db.scalars(select(MaterialAttribute).where(MaterialAttribute.material_id == m.id)))
        supported.append({x.attribute_name for x in attrs if x.source_evidence_id and x.normalized_value is not None})
        evidence_snapshot.append({x.attribute_name: str(x.source_evidence_id) for x in attrs if x.source_evidence_id})
    result = decide(comparisons, bool(rules) and a.category == b.category, all(required <= s for s in supported), dnm_violations=dnm_violations)

    match_score = 100 * sum(c["comparison_result"] == "MATCH" for c in comparisons) / max(1, len(comparisons))
    candidate.attribute_score = candidate.engineering_score = round(match_score, 2)
    candidate.status = "PENDING"
    decision = Decision(candidate_id=candidate.id, decision_score=match_score, confidence=match_score / 100, decided_by=user.id, snapshot={"a_revision": a.revision, "b_revision": b.revision, "rules": {str(r.id): r.version for r in rules}, "evidence_a": evidence_snapshot[0], "evidence_b": evidence_snapshot[1]}, **result)
    db.add(decision)
    db.flush()
    for c in comparisons:
        db.add(Comparison(candidate_id=candidate.id, decision_id=decision.id, **c))
    audit(db, user, "DECISION_GENERATED", decision, new=result, reason=result["reason"])
    return decision


def latest_decision(db, candidate_id):
    return db.scalar(select(Decision).where(Decision.candidate_id == candidate_id).order_by(Decision.created_at.desc(), Decision.id.desc()))


def retrieve(db, material, user, top_n=5):
    pool = list(db.scalars(select(Material).where(Material.category == material.category, Material.id != material.id, Material.embedding != None)))
    av = list(material.embedding) if material.embedding is not None else embedding_provider.embed_text(material.normalized_description or material.original_description)
    ranked = []
    for other in pool:
        semantic, fuzzy = scores(material.normalized_description or material.original_description, other.normalized_description, av, list(other.embedding))
        aa, bb = attributes(db, material.id), attributes(db, other.id)
        shared = set(aa) | set(bb)
        attr_score = 100 * sum(aa.get(k) == bb.get(k) and k in aa and k in bb for k in shared) / max(1, len(shared))
        ranked.append((0.35 * semantic + 0.25 * fuzzy + 0.4 * attr_score, semantic, fuzzy, other))
    output = []
    for score, semantic, fuzzy, other in sorted(ranked, key=lambda r: r[0], reverse=True)[:top_n]:
        a, b = sorted([material.id, other.id], key=str)
        candidate = db.scalar(select(Candidate).where(Candidate.material_a_id == a, Candidate.material_b_id == b))
        if not candidate:
            candidate = Candidate(material_a_id=a, material_b_id=b, semantic_score=semantic, fuzzy_score=fuzzy, final_score=round(score, 2))
            db.add(candidate)
            audit(db, user, "CANDIDATE_GENERATED", candidate, new={"score": score}, reason="Hybrid retrieval, not an identity verdict")
            evaluate(db, candidate, user)
        elif candidate.status != "APPROVED":
            latest = latest_decision(db, candidate.id)
            ma, mb = db.get(Material, a), db.get(Material, b)
            snapshot = {"a_revision": ma.revision, "b_revision": mb.revision, "rules": {str(r.id): r.version for r in category_rules(db, ma.category)}}
            candidate.semantic_score, candidate.fuzzy_score, candidate.final_score = semantic, fuzzy, round(score, 2)
            if not latest or any(latest.snapshot.get(k) != v for k, v in snapshot.items()):
                evaluate(db, candidate, user)
        output.append(candidate)
    return output


def duplicate_check(db, description, category):
    normalized, extracted = extraction_provider.extract_attributes(description, category, list(db.scalars(select(DictionaryEntry))))
    aa = {k: v["value"] for k, v in extracted.items()}
    vector = embedding_provider.embed_text(normalized)
    rules = category_rules(db, category)
    result = []
    for material in db.scalars(select(Material).where(Material.category == category)):
        semantic, fuzzy = scores(normalized, material.normalized_description or material.original_description, vector, list(material.embedding) if material.embedding is not None else embedding_provider.embed_text(material.original_description))
        comparison = compare(aa, attributes(db, material.id), rules)
        decision = decide(comparison, bool(rules))
        if max(semantic, fuzzy) < 35:
            continue
        mapping = db.scalar(select(LegacyMapping).where(LegacyMapping.material_id == material.id))
        identity = db.get(CommonIdentity, mapping.common_material_id) if mapping else None
        result.append({"material_id": str(material.id), "legacy_material_code": material.legacy_material_code, "description": material.original_description, "similarity": round((semantic + fuzzy) / 2, 1), "decision": decision, "comparisons": comparison, "common_identity": identity.nmip_code if identity else None, "common_identity_id": str(identity.id) if identity else None})
    return sorted(result, key=lambda x: (x["decision"]["decision_type"] == "IDENTITY_MATCH", x["similarity"]), reverse=True)[:10]
