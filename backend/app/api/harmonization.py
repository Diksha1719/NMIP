from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import current_user, require
from app.models import Material, MaterialAttribute, HarmonizationLog, TaxonomyNode
from app.schemas import HarmonizationRequest, HarmonizationApplyRequest
from app.ai.harmonization import harmonize_material_data
from app.repositories import get, serialize
from app.audit import audit

router = APIRouter(prefix="/api/ai/harmonize", dependencies=[Depends(current_user)])


@router.post("")
def harmonize(payload: HarmonizationRequest, db: Session = Depends(get_db)):
    result = harmonize_material_data(db, payload.text, payload.category)
    return result


@router.post("/apply")
def apply_harmonization(payload: HarmonizationApplyRequest, db: Session = Depends(get_db), user=Depends(require("DATA_STEWARD", "ENGINEER", "ADMIN"))):
    material = get(db, Material, payload.material_id)
    if not material:
        raise HTTPException(404, "Material not found")

    prev_val = {
        "normalized_description": material.normalized_description,
        "category": material.category,
    }

    material.normalized_description = payload.harmonized_title
    if payload.harmonized_category:
        material.category = payload.harmonized_category

    # Update or add attributes
    for attr_name, attr_val in payload.attributes.items():
        existing = db.scalar(
            select(MaterialAttribute).where(
                MaterialAttribute.material_id == material.id,
                MaterialAttribute.attribute_name == attr_name
            )
        )
        if existing:
            existing.normalized_value = attr_val
            existing.validation_status = "VERIFIED"
        else:
            db.add(MaterialAttribute(
                material_id=material.id,
                attribute_name=attr_name,
                raw_value=attr_val,
                normalized_value=attr_val,
                confidence=0.95,
                validation_status="VERIFIED"
            ))

    # Log harmonization action
    log = HarmonizationLog(
        material_id=material.id,
        original_text=material.original_description,
        harmonized_title=payload.harmonized_title,
        harmonized_category=payload.harmonized_category,
        taxonomy_node_code=payload.taxonomy_node_code,
        extracted_attributes=payload.attributes,
        confidence_score=0.95,
        harmonized_by=user.id
    )
    db.add(log)
    db.flush()

    audit(db, user, "AI_HARMONIZATION_APPLIED", material, previous=prev_val, new={"normalized_description": payload.harmonized_title, "category": payload.harmonized_category}, reason="Applied AI Harmonization output to material catalog record.")
    db.commit()
    return serialize(material)


@router.get("/logs")
def get_logs(db: Session = Depends(get_db)):
    logs = db.scalars(select(HarmonizationLog).order_by(HarmonizationLog.created_at.desc()).limit(50)).all()
    return [serialize(l) for l in logs]
