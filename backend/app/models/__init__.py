import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from app.db import Base

J = JSON().with_variant(JSONB(), "postgresql")
V = JSON().with_variant(Vector(384), "postgresql")


def now():
    return datetime.now(timezone.utc)


class Record:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Organization(Record, Base):
    __tablename__ = "organizations"
    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(30), unique=True)
    description: Mapped[str] = mapped_column(Text, default="Synthetic demonstration organization")


class User(Record, Base):
    __tablename__ = "users"
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(250), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(30))
    organization_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Dataset(Record, Base):
    __tablename__ = "datasets"
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    name: Mapped[str] = mapped_column(String(250))
    source_type: Mapped[str] = mapped_column(String(20))
    filename: Mapped[str] = mapped_column(String(250))
    status: Mapped[str] = mapped_column(String(30), default="UPLOADED")
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, default=0)
    invalid_rows: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    source_rows: Mapped[list] = mapped_column(J, default=list)
    column_mapping: Mapped[dict] = mapped_column(J, default=dict)
    validation_report: Mapped[list] = mapped_column(J, default=list)


class Material(Record, Base):
    __tablename__ = "materials"
    __table_args__ = (UniqueConstraint("organization_id", "legacy_material_code"),)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    dataset_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("datasets.id"))
    legacy_material_code: Mapped[str] = mapped_column(String(120))
    original_description: Mapped[str] = mapped_column(Text)
    normalized_description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100))
    subcategory: Mapped[str] = mapped_column(String(100), default="")
    status: Mapped[str] = mapped_column(String(30), default="INGESTED")
    data_quality_score: Mapped[float] = mapped_column(Float, default=0)
    embedding: Mapped[list | None] = mapped_column(V)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Evidence(Record, Base):
    __tablename__ = "evidence"
    material_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("materials.id"), index=True)
    source_type: Mapped[str] = mapped_column(String(30))
    source_file: Mapped[str] = mapped_column(String(250))
    page_number: Mapped[int | None] = mapped_column(Integer)
    row_number: Mapped[int | None] = mapped_column(Integer)
    source_text: Mapped[str] = mapped_column(Text)
    extracted_value: Mapped[str | None] = mapped_column(Text)
    evidence_type: Mapped[str] = mapped_column(String(50))
    confidence: Mapped[float] = mapped_column(Float, default=1)
    extraction_method: Mapped[str] = mapped_column(String(20), default="RULE")


class MaterialAttribute(Record, Base):
    __tablename__ = "material_attributes"
    __table_args__ = (UniqueConstraint("material_id", "attribute_name"),)
    material_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("materials.id"), index=True)
    attribute_name: Mapped[str] = mapped_column(String(100))
    raw_value: Mapped[str | None] = mapped_column(Text)
    normalized_value: Mapped[str | None] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(String(30))
    confidence: Mapped[float] = mapped_column(Float, default=0)
    source_evidence_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("evidence.id"))
    validation_status: Mapped[str] = mapped_column(String(30), default="MISSING")


class Candidate(Record, Base):
    __tablename__ = "material_candidates"
    __table_args__ = (UniqueConstraint("material_a_id", "material_b_id"),)
    material_a_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("materials.id"))
    material_b_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("materials.id"))
    semantic_score: Mapped[float] = mapped_column(Float)
    fuzzy_score: Mapped[float] = mapped_column(Float)
    attribute_score: Mapped[float] = mapped_column(Float, default=0)
    engineering_score: Mapped[float] = mapped_column(Float, default=0)
    final_score: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="PENDING")


class Decision(Record, Base):
    __tablename__ = "decisions"
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("material_candidates.id"), index=True)
    decision_type: Mapped[str] = mapped_column(String(40))
    decision_score: Mapped[float] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    decided_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    decision_source: Mapped[str] = mapped_column(String(30), default="RULE_ENGINE")
    snapshot: Mapped[dict] = mapped_column(J)


class Comparison(Record, Base):
    __tablename__ = "engineering_comparisons"
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("material_candidates.id"))
    decision_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("decisions.id"))
    attribute_name: Mapped[str] = mapped_column(String(100))
    value_a: Mapped[str | None] = mapped_column(Text)
    value_b: Mapped[str | None] = mapped_column(Text)
    comparison_result: Mapped[str] = mapped_column(String(30))
    criticality: Mapped[str] = mapped_column(String(30))
    tolerance: Mapped[float] = mapped_column(Float, default=0)
    explanation: Mapped[str] = mapped_column(Text)


class Review(Record, Base):
    __tablename__ = "reviews"
    decision_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("decisions.id"))
    reviewer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(30))
    comment: Mapped[str] = mapped_column(Text)


class CommonIdentity(Record, Base):
    __tablename__ = "common_material_identities"
    nmip_code: Mapped[str] = mapped_column(String(50), unique=True)
    canonical_name: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100))
    canonical_attributes: Mapped[dict] = mapped_column(J)
    status: Mapped[str] = mapped_column(String(30), default="VERIFIED")
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class LegacyMapping(Record, Base):
    __tablename__ = "legacy_code_mappings"
    common_material_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("common_material_identities.id"))
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    material_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("materials.id"), unique=True)
    mapping_type: Mapped[str] = mapped_column(String(30), default="IDENTITY")
    verified: Mapped[bool] = mapped_column(Boolean, default=True)


class EngineeringRule(Record, Base):
    __tablename__ = "engineering_rules"
    category: Mapped[str] = mapped_column(String(100))
    attribute_name: Mapped[str] = mapped_column(String(100))
    rule_type: Mapped[str] = mapped_column(String(30), default="EXACT")
    rule_definition: Mapped[dict] = mapped_column(J, default=dict)
    severity: Mapped[str] = mapped_column(String(30), default="CRITICAL")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[int] = mapped_column(Integer, default=1)


class AuditLog(Record, Base):
    __tablename__ = "audit_logs"
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str] = mapped_column(String(100))
    previous_value: Mapped[dict | None] = mapped_column(J)
    new_value: Mapped[dict | None] = mapped_column(J)
    reason: Mapped[str] = mapped_column(Text, default="")


class DictionaryEntry(Record, Base):
    __tablename__ = "dictionary_entries"
    term: Mapped[str] = mapped_column(String(100), unique=True)
    expansion: Mapped[str] = mapped_column(String(200))
    kind: Mapped[str] = mapped_column(String(40), default="ABBREVIATION")
    category: Mapped[str] = mapped_column(String(100), default="*")
    version: Mapped[int] = mapped_column(Integer, default=1)


class BenchmarkRun(Record, Base):
    __tablename__ = "benchmark_runs"
    uploaded_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    filename: Mapped[str] = mapped_column(String(250))
    row_count: Mapped[int] = mapped_column(Integer)
    metrics: Mapped[dict] = mapped_column(J)


class DoNotMergeRule(Record, Base):
    __tablename__ = "do_not_merge_rules"
    name: Mapped[str] = mapped_column(String(150))
    category: Mapped[str] = mapped_column(String(100), default="*")
    attribute_a: Mapped[str] = mapped_column(String(100))
    attribute_b: Mapped[str] = mapped_column(String(100))
    condition: Mapped[str] = mapped_column(String(50), default="DIFFERENT")
    severity: Mapped[str] = mapped_column(String(30), default="CRITICAL")
    reason: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))


class TaxonomyNode(Record, Base):
    __tablename__ = "taxonomy_nodes"
    code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("taxonomy_nodes.id"))
    level: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(Text, default="")
    attribute_schema: Mapped[list] = mapped_column(J, default=list)


class HarmonizationLog(Record, Base):
    __tablename__ = "harmonization_logs"
    material_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("materials.id"))
    original_text: Mapped[str] = mapped_column(Text)
    harmonized_title: Mapped[str] = mapped_column(Text)
    harmonized_category: Mapped[str] = mapped_column(String(100))
    taxonomy_node_code: Mapped[str | None] = mapped_column(String(50))
    extracted_attributes: Mapped[dict] = mapped_column(J, default=dict)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    harmonized_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

