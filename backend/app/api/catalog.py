import csv
import io
from collections import defaultdict, Counter
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import current_user, require
from app.models import Material, Organization, MaterialAttribute, Evidence, Dataset, Candidate, Decision, Comparison, Review, CommonIdentity, LegacyMapping, DictionaryEntry
from app.schemas import MaterialInput, Correction, AttributeInput, Retrieve, ReviewInput, DuplicateInput, MappingInput, DatasetRowCorrection
from app.repositories import get, rows, serialize
from app.services.materials import process, ensure_editable
from app.services.ingestion import parse_file, validate, import_dataset, MAX_UPLOAD
from app.services.reviews import review, approve_identity
from app.matching import retrieve, evaluate, latest_decision, duplicate_check
from app.normalization import normalize
from app.audit import audit

router = APIRouter(prefix="/api", dependencies=[Depends(current_user)])


def material_view(db, m):
    data = serialize(m)
    data["organization"] = get(db, Organization, m.organization_id).code
    mapping = db.scalar(select(LegacyMapping).where(LegacyMapping.material_id == m.id))
    identity = get(db, CommonIdentity, mapping.common_material_id) if mapping else None
    data["common_identity"] = identity.nmip_code if identity else None
    data["common_identity_id"] = str(identity.id) if identity else None
    return data


def candidate_view(db, candidate):
    data = serialize(candidate)
    data["material_a"] = material_view(db, get(db, Material, candidate.material_a_id))
    data["material_b"] = material_view(db, get(db, Material, candidate.material_b_id))
    decision = latest_decision(db, candidate.id)
    data["decision"] = serialize(decision) if decision else None
    comparisons = list(db.scalars(select(Comparison).where(Comparison.decision_id == decision.id))) if decision else []
    data["critical_conflicts"] = sum(c.comparison_result == "CONFLICT" and c.criticality == "CRITICAL" for c in comparisons)
    data["missing_attributes"] = sum(c.comparison_result == "MISSING" for c in comparisons)
    data["evidence_count"] = len(list(db.scalars(select(MaterialAttribute).where(MaterialAttribute.material_id.in_([candidate.material_a_id, candidate.material_b_id]), MaterialAttribute.source_evidence_id != None))))
    return data


def candidate_views(db, candidates):
    """Batch load catalog views to avoid per-row queries in the candidate grid."""
    candidates = list(candidates)
    orgs = {o.id: o.code for o in rows(db, Organization)}
    identities = {i.id: i for i in rows(db, CommonIdentity)}
    mappings = {m.material_id: m for m in rows(db, LegacyMapping)}
    materials = {}
    for m in rows(db, Material):
        mapping = mappings.get(m.id)
        identity = identities.get(mapping.common_material_id) if mapping else None
        materials[m.id] = {**serialize(m), "organization": orgs[m.organization_id], "common_identity": identity.nmip_code if identity else None, "common_identity_id": str(identity.id) if identity else None}
    decisions = {}
    for d in rows(db, Decision):
        decisions.setdefault(d.candidate_id, d)
    comparisons = defaultdict(list)
    for c in rows(db, Comparison):
        comparisons[c.decision_id].append(c)
    evidence = Counter(a.material_id for a in db.scalars(select(MaterialAttribute).where(MaterialAttribute.source_evidence_id != None)))
    output = []
    for c in candidates:
        d = decisions.get(c.id)
        checks = comparisons[d.id] if d else []
        output.append({**serialize(c), "material_a": materials[c.material_a_id], "material_b": materials[c.material_b_id], "decision": serialize(d) if d else None, "critical_conflicts": sum(x.comparison_result == "CONFLICT" and x.criticality == "CRITICAL" for x in checks), "missing_attributes": sum(x.comparison_result == "MISSING" for x in checks), "evidence_count": evidence[c.material_a_id] + evidence[c.material_b_id]})
    return output


@router.get("/organizations")
def organizations(db: Session = Depends(get_db)):
    return [serialize(x) for x in rows(db, Organization)]


@router.get("/materials")
def materials(q: str = "", organization: str = "", category: str = "", status: str = "", decision: str = "", confidence: float = 0, grade: str = "", standard: str = "", common_identity: str = "", date: str = "", db: Session = Depends(get_db)):
    result = []
    for material in rows(db, Material):
        data = material_view(db, material)
        attrs = list(db.scalars(select(MaterialAttribute).where(MaterialAttribute.material_id == material.id)))
        searchable = " ".join([material.legacy_material_code, material.original_description, data["common_identity"] or ""] + [a.normalized_value or "" for a in attrs]).lower()
        if q.lower() not in searchable or (organization and data["organization"] != organization) or (category and material.category != category) or (status and material.status != status) or material.data_quality_score < confidence:
            continue
        if common_identity and common_identity.lower() not in (data["common_identity"] or "").lower():
            continue
        if date and material.created_at.date().isoformat() < date:
            continue
        if any(value and not any(a.attribute_name == key and value.lower() in (a.normalized_value or "").lower() for a in attrs) for key, value in (("material_grade", grade), ("standard", standard))):
            continue
        if decision:
            candidates = db.scalars(select(Candidate).where(or_(Candidate.material_a_id == material.id, Candidate.material_b_id == material.id)))
            if not any((d := latest_decision(db, c.id)) and d.decision_type == decision for c in candidates):
                continue
        result.append(data)
    return result


@router.post("/materials", status_code=201)
def create_material(payload: MaterialInput, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    get(db, Organization, payload.organization_id)
    duplicate = duplicate_check(db, payload.original_description, payload.category)
    likely = [x for x in duplicate if x["decision"]["decision_type"] == "IDENTITY_MATCH"]
    if likely and len(payload.override_reason.strip()) < 10:
        raise HTTPException(409, {"message": "Potential existing material identity. A steward or admin must provide an override reason (10+ characters).", "matches": likely})
    material = Material(**payload.model_dump(exclude={"override_reason"}))
    db.add(material)
    audit(db, user, "DUPLICATE_OVERRIDE" if likely else "MATERIAL_CREATED", material, new=payload.model_dump(mode="json"), reason=payload.override_reason or "New source material")
    process(db, material, user)
    return material_view(db, material)


@router.get("/materials/{id}")
def material_detail(id: UUID, db: Session = Depends(get_db)):
    material = get(db, Material, id)
    return {**material_view(db, material), "attributes": [serialize(a) for a in db.scalars(select(MaterialAttribute).where(MaterialAttribute.material_id == id))], "evidence": [serialize(e) for e in db.scalars(select(Evidence).where(Evidence.material_id == id))]}


@router.put("/materials/{id}")
def correct_material(id: UUID, payload: Correction, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    material = get(db, Material, id)
    ensure_editable(db, material)
    previous = serialize(material)
    material.original_description = payload.original_description
    process(db, material, user)
    audit(db, user, "MATERIAL_CORRECTED", material, previous=previous, new=serialize(material), reason=payload.reason)
    return material_view(db, material)


@router.post("/materials/{id}/attributes")
def add_attribute(id: UUID, payload: AttributeInput, db: Session = Depends(get_db), user=Depends(require("ENGINEER", "DATA_STEWARD"))):
    material = get(db, Material, id)
    ensure_editable(db, material)
    if payload.value.lower() not in payload.source_text.lower():
        raise HTTPException(422, "The supplied value must appear in the quoted evidence.")
    attr = db.scalar(select(MaterialAttribute).where(MaterialAttribute.material_id == id, MaterialAttribute.attribute_name == payload.attribute_name))
    previous = serialize(attr) if attr else None
    evidence = Evidence(material_id=id, source_type="HUMAN", source_file=payload.source_file, source_text=payload.source_text, extracted_value=payload.value, evidence_type=payload.attribute_name, extraction_method="HUMAN", confidence=1)
    db.add(evidence)
    db.flush()
    if not attr:
        attr = MaterialAttribute(material_id=id, attribute_name=payload.attribute_name)
        db.add(attr)
    attr.raw_value = payload.value
    attr.normalized_value = payload.value.strip().lower()
    attr.confidence = 1
    attr.validation_status = "SUPPORTED"
    attr.source_evidence_id = evidence.id
    material.revision += 1
    audit(db, user, "ATTRIBUTE_CORRECTED", material, previous=previous, new=payload.model_dump(), reason=payload.reason)
    for candidate in db.scalars(select(Candidate).where(or_(Candidate.material_a_id == id, Candidate.material_b_id == id))):
        evaluate(db, candidate, user)
    return serialize(attr)


@router.post("/materials/{id}/normalize")
def normalize_material(id: UUID, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    material = get(db, Material, id)
    ensure_editable(db, material)
    material.normalized_description = normalize(material.original_description, material.category, rows(db, DictionaryEntry))
    material.status = "NORMALIZED"
    material.revision += 1
    audit(db, user, "MATERIAL_NORMALIZED", material, new={"normalized": material.normalized_description}, reason="Original text retained")
    return material_view(db, material)


@router.post("/materials/{id}/extract")
@router.post("/materials/{id}/enrich")
def extract_material(id: UUID, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    material = get(db, Material, id)
    source = db.scalar(select(Evidence).where(Evidence.material_id == id, Evidence.evidence_type == "SOURCE"))
    process(db, material, user, source.source_file if source else "Manual entry", source.row_number if source else None, source.source_type if source else "MANUAL", source.page_number if source else None)
    return material_view(db, material)


@router.post("/pipeline/{stage}")
def pipeline(stage: str, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    if stage not in ("normalize", "extract", "enrich"):
        raise HTTPException(404, "Unknown pipeline stage")
    count = 0
    for material in rows(db, Material):
        if material.status in ("VERIFIED", "PUBLISHED"):
            continue
        if stage == "normalize":
            normalize_material(material.id, db, user)
        else:
            extract_material(material.id, db, user)
        count += 1
    return {"processed": count}


@router.post("/datasets/upload", status_code=201)
async def upload(organization_id: UUID = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    get(db, Organization, organization_id)
    data = await file.read(MAX_UPLOAD + 1)
    source_rows = parse_file(file.filename or "", data)
    filename = (file.filename or "upload").replace("\\", "/").split("/")[-1][:250]
    dataset = Dataset(organization_id=organization_id, name=filename, source_type=filename.rsplit(".", 1)[-1].upper(), filename=filename, uploaded_by=user.id, row_count=len(source_rows), source_rows=source_rows)
    db.add(dataset)
    audit(db, user, "DATASET_UPLOADED", dataset, new={"filename": filename, "rows": len(source_rows)}, reason="Awaiting column mapping and validation")
    return {**serialize(dataset), "columns": list(source_rows[0]), "preview": source_rows[:10]}


@router.get("/datasets")
def datasets(db: Session = Depends(get_db)):
    return [serialize(d) for d in rows(db, Dataset)]


@router.get("/datasets/{id}")
def dataset_detail(id: UUID, offset: int = 0, db: Session = Depends(get_db)):
    d = get(db, Dataset, id)
    offset = max(0, offset)
    return {**serialize(d), "columns": list(d.source_rows[0]) if d.source_rows else [], "preview": d.source_rows[offset:offset+10], "offset": offset}


@router.put("/datasets/{id}/rows")
def correct_dataset_row(id: UUID, payload: DatasetRowCorrection, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    d = get(db, Dataset, id)
    if d.status == "IMPORTED":
        raise HTTPException(409, "Imported source rows are immutable; correct the unverified material instead.")
    if payload.row_index >= len(d.source_rows):
        raise HTTPException(422, "Source row does not exist.")
    previous = dict(d.source_rows[payload.row_index])
    allowed = set(previous) - {"page_number"}
    if set(payload.values) - allowed or any(len(v) > 10000 for v in payload.values.values()):
        raise HTTPException(422, "Invalid source column or value exceeds 10,000 characters.")
    updated = [dict(row) for row in d.source_rows]
    updated[payload.row_index].update(payload.values)
    d.source_rows = updated
    d.status = "UPLOADED"
    d.validation_report = []
    d.valid_rows = d.invalid_rows = 0
    audit(db, user, "DATASET_ROW_CORRECTED", d, previous={"row": payload.row_index + 2, "values": previous}, new={"values": updated[payload.row_index]}, reason=payload.reason)
    return {"row_index": payload.row_index, "values": updated[payload.row_index], "status": d.status}


@router.post("/datasets/{id}/validate")
def validate_dataset(id: UUID, mapping: dict[str, str], db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    d = get(db, Dataset, id)
    if d.status == "IMPORTED":
        raise HTTPException(409, "Imported dataset validation is immutable.")
    report = validate(db, d, mapping)
    audit(db, user, "DATASET_VALIDATED", d, new={"valid": d.valid_rows, "invalid": d.invalid_rows}, reason="Column mapping and row checks")
    return {"rows": report, "valid_rows": d.valid_rows, "invalid_rows": d.invalid_rows}


@router.get("/datasets/{id}/validation")
def validation(id: UUID, db: Session = Depends(get_db)):
    d = get(db, Dataset, id)
    return {"rows": d.validation_report, "valid_rows": d.valid_rows, "invalid_rows": d.invalid_rows}


@router.get("/datasets/{id}/validation.csv")
def validation_csv(id: UUID, db: Session = Depends(get_db)):
    d = get(db, Dataset, id)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["row", "errors"])
    writer.writerows((r["row"], "; ".join(r["errors"]) or "VALID") for r in d.validation_report)
    return Response(buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="validation.csv"'})


@router.post("/datasets/{id}/import")
def dataset_import(id: UUID, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    d = db.scalar(select(Dataset).where(Dataset.id == id).with_for_update())
    if not d:
        raise HTTPException(404, "Dataset not found")
    return import_dataset(db, d, user)


@router.delete("/datasets/{id}")
def delete_dataset(id: UUID, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD"))):
    d = get(db, Dataset, id)
    previous = {"filename": d.filename, "row_count": d.row_count, "status": d.status}

    # Unlink any materials referencing this dataset to satisfy foreign key constraints
    for material in db.scalars(select(Material).where(Material.dataset_id == id)):
        material.dataset_id = None

    audit(db, user, "DATASET_DELETED", d, previous=previous, reason="User requested dataset deletion")
    db.delete(d)
    db.commit()
    return {"message": "Dataset deleted successfully", "id": str(id)}




@router.get("/candidates")
def candidates(db: Session = Depends(get_db)):
    return candidate_views(db, rows(db, Candidate))


@router.get("/materials/{id}/candidates")
def material_candidates(id: UUID, db: Session = Depends(get_db)):
    get(db, Material, id)
    return [candidate_view(db, c) for c in db.scalars(select(Candidate).where(or_(Candidate.material_a_id == id, Candidate.material_b_id == id)))]


@router.post("/candidates/retrieve")
def retrieve_candidates(payload: Retrieve, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD", "ENGINEER"))):
    targets = [get(db, Material, payload.material_id)] if payload.material_id else list(db.scalars(select(Material).where(Material.embedding != None)))
    result = {}
    for material in targets:
        for c in retrieve(db, material, user, payload.top_n):
            result[str(c.id)] = c
    return candidate_views(db, result.values())


@router.get("/candidates/{id}/comparison")
def comparison(id: UUID, db: Session = Depends(get_db)):
    c = get(db, Candidate, id)
    decision = latest_decision(db, id)
    return {**candidate_view(db, c), "comparisons": [serialize(x) for x in db.scalars(select(Comparison).where(Comparison.decision_id == decision.id))] if decision else [], "evidence": [serialize(x) for x in db.scalars(select(Evidence).where(Evidence.material_id.in_([c.material_a_id, c.material_b_id])))], "reviews": [serialize(x) for x in db.scalars(select(Review).join(Decision).where(Decision.candidate_id == id))]}


@router.post("/candidates/{id}/decision")
def decision(id: UUID, db: Session = Depends(get_db), user=Depends(require("ENGINEER"))):
    c = get(db, Candidate, id)
    if c.status == "APPROVED":
        raise HTTPException(409, "Approved recommendations are immutable.")
    return serialize(evaluate(db, c, user))


@router.post("/reviews")
def submit_review(payload: ReviewInput, db: Session = Depends(get_db), user=Depends(require("ENGINEER"))):
    return review(db, payload, user)


@router.get("/common-identities")
def identities(db: Session = Depends(get_db)):
    return [{**serialize(c), "mapping_count": len(list(db.scalars(select(LegacyMapping).where(LegacyMapping.common_material_id == c.id))))} for c in rows(db, CommonIdentity)]


@router.get("/common-identities/{id}")
def identity_detail(id: UUID, db: Session = Depends(get_db)):
    identity = get(db, CommonIdentity, id)
    mappings = list(db.scalars(select(LegacyMapping).where(LegacyMapping.common_material_id == id)))
    ids = [m.material_id for m in mappings]
    reviews = db.scalars(select(Review).join(Decision).join(Candidate).where(or_(Candidate.material_a_id.in_(ids), Candidate.material_b_id.in_(ids))))
    return {**serialize(identity), "mappings": [material_view(db, get(db, Material, m.material_id)) for m in mappings], "evidence": [serialize(e) for e in db.scalars(select(Evidence).where(Evidence.material_id.in_(ids)))], "reviews": [serialize(r) for r in reviews]}


@router.post("/common-identities")
def create_identity(payload: MappingInput, db: Session = Depends(get_db), user=Depends(require("ENGINEER"))):
    d = get(db, Decision, payload.decision_id)
    if d.decision_type != "IDENTITY_MATCH" or not db.scalar(select(Review).where(Review.decision_id == d.id, Review.action == "APPROVE")):
        raise HTTPException(409, "An approved identity-match review is required.")
    return serialize(approve_identity(db, d, user))


@router.post("/common-identities/{id}/mappings")
def add_mapping(id: UUID, payload: MappingInput, db: Session = Depends(get_db), user=Depends(require("ENGINEER"))):
    get(db, CommonIdentity, id)
    d = get(db, Decision, payload.decision_id)
    c = get(db, Candidate, d.candidate_id)
    if not db.scalar(select(LegacyMapping).where(LegacyMapping.common_material_id == id, LegacyMapping.material_id.in_([c.material_a_id, c.material_b_id]))):
        raise HTTPException(409, "The approved pair must include a member of this identity.")
    result = create_identity(payload, db, user)
    if result["id"] != str(id):
        raise HTTPException(409, "Identity mismatch")
    return result


@router.post("/common-identities/{id}/publish")
def publish(id: UUID, db: Session = Depends(get_db), user=Depends(require("ENGINEER"))):
    identity = get(db, CommonIdentity, id)
    previous = serialize(identity)
    identity.status = "PUBLISHED"
    audit(db, user, "IDENTITY_PUBLISHED", identity, previous=previous, new=serialize(identity), reason="Published to NMIP catalog; external ERP integration is not configured")
    return serialize(identity)


@router.get("/common-identities/{id}/export")
def export_identity(id: UUID, db: Session = Depends(get_db)):
    return identity_detail(id, db)


@router.post("/duplicate-check")
def duplicates(payload: DuplicateInput, db: Session = Depends(get_db), user=Depends(current_user)):
    result = duplicate_check(db, payload.description, payload.category)
    if result:
        audit(db, user, "DUPLICATE_CHECK", get(db, Material, result[0]["material_id"]), new={"matches": len(result), "description": payload.description}, reason="Pre-creation duplicate check")
    return result
