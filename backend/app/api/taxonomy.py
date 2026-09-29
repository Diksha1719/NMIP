from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth import current_user, require
from app.models import TaxonomyNode, Material
from app.schemas import TaxonomyNodeInput
from app.ai.harmonization import harmonize_material_data
from app.repositories import get, serialize
from app.audit import audit

router = APIRouter(prefix="/api/taxonomy", dependencies=[Depends(current_user)])


def build_node_tree(nodes, parent_id=None, material_counts=None):
    tree = []
    material_counts = material_counts or {}
    children = [n for n in nodes if n.parent_id == parent_id]
    for n in children:
        data = serialize(n)
        child_nodes = build_node_tree(nodes, n.id, material_counts)
        direct_count = material_counts.get(n.name, 0)
        total_count = direct_count + sum(c.get("total_material_count", 0) for c in child_nodes)
        data["children"] = child_nodes
        data["direct_material_count"] = direct_count
        data["total_material_count"] = total_count
        tree.append(data)
    return tree


@router.get("/tree")
def get_taxonomy_tree(db: Session = Depends(get_db)):
    nodes = list(db.scalars(select(TaxonomyNode).order_by(TaxonomyNode.level, TaxonomyNode.name)))
    
    # Calculate material counts per category
    counts_query = db.query(Material.category, func.count(Material.id)).group_by(Material.category).all()
    material_counts = {cat: count for cat, count in counts_query}

    tree = build_node_tree(nodes, None, material_counts)
    return {"tree": tree, "total_nodes": len(nodes)}


@router.post("/nodes")
def create_node(payload: TaxonomyNodeInput, db: Session = Depends(get_db), user=Depends(require("ADMIN", "DATA_STEWARD"))):
    existing = db.scalar(select(TaxonomyNode).where(TaxonomyNode.code == payload.code))
    if existing:
        raise HTTPException(400, "Taxonomy node code already exists")

    parent = get(db, TaxonomyNode, payload.parent_id) if payload.parent_id else None
    level = (parent.level + 1) if parent else 0

    node = TaxonomyNode(
        code=payload.code,
        name=payload.name,
        parent_id=payload.parent_id,
        level=level,
        description=payload.description,
        attribute_schema=payload.attribute_schema
    )
    db.add(node)
    db.flush()
    audit(db, user, "TAXONOMY_NODE_CREATED", node, new=payload.model_dump(), reason="Created classification tree node")
    db.commit()
    return serialize(node)


@router.put("/nodes/{node_id}")
def update_node(node_id: UUID, payload: TaxonomyNodeInput, db: Session = Depends(get_db), user=Depends(require("ADMIN", "DATA_STEWARD"))):
    node = get(db, TaxonomyNode, node_id)
    if not node:
        raise HTTPException(404, "Taxonomy node not found")
    prev = serialize(node)

    parent = get(db, TaxonomyNode, payload.parent_id) if payload.parent_id else None
    node.code = payload.code
    node.name = payload.name
    node.parent_id = payload.parent_id
    node.level = (parent.level + 1) if parent else 0
    node.description = payload.description
    node.attribute_schema = payload.attribute_schema

    db.flush()
    audit(db, user, "TAXONOMY_NODE_UPDATED", node, previous=prev, new=payload.model_dump(), reason="Updated classification tree node")
    db.commit()
    return serialize(node)


@router.delete("/nodes/{node_id}")
def delete_node(node_id: UUID, db: Session = Depends(get_db), user=Depends(require("ADMIN"))):
    node = get(db, TaxonomyNode, node_id)
    if not node:
        raise HTTPException(404, "Node not found")
    has_children = db.scalar(select(TaxonomyNode).where(TaxonomyNode.parent_id == node.id))
    if has_children:
        raise HTTPException(400, "Cannot delete node with sub-categories. Delete sub-nodes first.")
    
    audit(db, user, "TAXONOMY_NODE_DELETED", node, previous=serialize(node), reason="Deleted classification node")
    db.delete(node)
    db.commit()
    return {"message": "Node deleted"}


@router.post("/classify")
def classify_text(payload: dict, db: Session = Depends(get_db)):
    text = payload.get("text", "")
    harmonized = harmonize_material_data(db, text)
    matched_node = None
    if harmonized.get("taxonomy_node_code"):
        matched_node = db.scalar(select(TaxonomyNode).where(TaxonomyNode.code == harmonized["taxonomy_node_code"]))
    
    return {
        "text": text,
        "category": harmonized.get("harmonized_category"),
        "taxonomy_node": serialize(matched_node) if matched_node else None,
        "confidence": harmonized.get("confidence_score", 0.85)
    }
