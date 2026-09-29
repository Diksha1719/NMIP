from sqlalchemy import select
from fastapi import HTTPException
from app.models import Material, MaterialAttribute, Evidence, DictionaryEntry, EngineeringRule, LegacyMapping, Candidate
from app.ai import embedding_provider, extraction_provider
from app.audit import audit


def attributes(db, material_id):
    return {a.attribute_name: a.normalized_value for a in db.scalars(select(MaterialAttribute).where(MaterialAttribute.material_id == material_id)) if a.normalized_value is not None}


def ensure_editable(db, material):
    db.scalar(select(Material).where(Material.id == material.id).with_for_update().execution_options(populate_existing=True))
    if db.scalar(select(LegacyMapping).where(LegacyMapping.material_id == material.id)):
        raise HTTPException(409, "This material has a verified identity. Create a separate corrected source record for engineering review.")


def process(db, material, user, source_file="Manual entry", row_number=None, source_type="MANUAL", page_number=None):
    ensure_editable(db, material)
    dictionary = list(db.scalars(select(DictionaryEntry)))
    normalized, extracted = extraction_provider.extract_attributes(material.original_description, material.category, dictionary)
    material.normalized_description = normalized
    material.embedding = embedding_provider.embed_text(normalized)
    old = {a.attribute_name: a for a in db.scalars(select(MaterialAttribute).where(MaterialAttribute.material_id == material.id))}
    required = {r.attribute_name for r in db.scalars(select(EngineeringRule).where(EngineeringRule.category == material.category, EngineeringRule.is_active == True))}
    for name in set(extracted) | required | set(old):
        item = extracted.get(name)
        attribute = old.get(name)
        if not attribute:
            attribute = MaterialAttribute(material_id=material.id, attribute_name=name)
            db.add(attribute)
        attribute.raw_value = item["raw"] if item else None
        attribute.normalized_value = item["value"] if item else None
        attribute.unit = item["unit"] if item else None
        attribute.confidence = item["confidence"] if item else 0
        attribute.validation_status = "SUPPORTED" if item else "MISSING"
        attribute.source_evidence_id = None
        if item:
            evidence = Evidence(material_id=material.id, source_type=source_type, source_file=source_file, row_number=row_number, page_number=page_number, source_text=material.original_description, extracted_value=item["value"], evidence_type=name, extraction_method="RULE", confidence=item["confidence"])
            db.add(evidence)
            db.flush()
            attribute.source_evidence_id = evidence.id
    material.data_quality_score = round(100 * len(required & set(extracted)) / len(required), 1) if required else 0
    material.status = "EXTRACTED"
    material.revision += 1
    audit(db, user, "MATERIAL_PROCESSED", material, new={"revision": material.revision, "attributes": extracted}, reason="Deterministic rule extraction; source preserved")
    return material
