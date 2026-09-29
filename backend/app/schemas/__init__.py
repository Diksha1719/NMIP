from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

Role = Literal["ADMIN", "ENGINEER", "DATA_STEWARD", "VIEWER"]
Outcome = Literal["IDENTITY_MATCH", "POTENTIAL_SUBSTITUTE", "DO_NOT_MERGE", "INSUFFICIENT_INFORMATION"]


class Login(BaseModel):
    email: str
    password: str = Field(max_length=200)


class MaterialInput(BaseModel):
    organization_id: UUID
    legacy_material_code: str = Field(min_length=1, max_length=120, pattern=r".*\S.*")
    original_description: str = Field(min_length=3, max_length=10000)
    category: str = Field(min_length=1, max_length=100)
    override_reason: str = Field(default="", max_length=2000)


class Correction(BaseModel):
    original_description: str = Field(min_length=3, max_length=10000)
    reason: str = Field(min_length=5, max_length=2000)


class AttributeInput(BaseModel):
    attribute_name: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=500)
    source_text: str = Field(min_length=5, max_length=10000)
    source_file: str = Field(min_length=1, max_length=250)
    reason: str = Field(min_length=5, max_length=2000)


class Retrieve(BaseModel):
    material_id: UUID | None = None
    top_n: int = Field(default=5, ge=1, le=20)


class ReviewInput(BaseModel):
    decision_id: UUID
    action: Literal["APPROVE", "REJECT", "REQUEST_INFORMATION"]
    comment: str = Field(min_length=5, max_length=3000)


class DuplicateInput(BaseModel):
    description: str = Field(min_length=3, max_length=10000)
    category: str = Field(min_length=1, max_length=100)


class RuleInput(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    attribute_name: str = Field(min_length=1, max_length=100)
    rule_type: Literal["EXACT", "NUMERIC"] = "EXACT"
    rule_definition: dict = Field(default_factory=lambda: {"tolerance": 0})
    severity: Literal["CRITICAL", "IMPORTANT", "NON_CRITICAL"] = "CRITICAL"
    is_active: bool = True


class UserInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=12, max_length=200)
    role: Role
    organization_id: UUID | None = None


class UserUpdate(BaseModel):
    role: Role
    is_active: bool


class DictionaryInput(BaseModel):
    term: str = Field(min_length=1, max_length=100)
    expansion: str = Field(min_length=1, max_length=200)
    kind: Literal["ABBREVIATION", "SYNONYM", "STANDARD", "OEM"] = "ABBREVIATION"
    category: str = Field(default="*", max_length=100)


class MappingInput(BaseModel):
    decision_id: UUID


class DatasetRowCorrection(BaseModel):
    row_index: int = Field(ge=0)
    values: dict[str, str]
    reason: str = Field(min_length=5, max_length=2000)


class DoNotMergeRuleInput(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    category: str = Field(default="*", max_length=100)
    attribute_a: str = Field(min_length=1, max_length=100)
    attribute_b: str = Field(min_length=1, max_length=100)
    condition: Literal["DIFFERENT", "VALUE_MISMATCH", "EXPLICIT_BLOCK"] = "DIFFERENT"
    severity: Literal["CRITICAL", "IMPORTANT", "BLOCK"] = "CRITICAL"
    reason: str = Field(min_length=5, max_length=1000)
    is_active: bool = True


class TaxonomyNodeInput(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=150)
    parent_id: UUID | None = None
    description: str = Field(default="", max_length=2000)
    attribute_schema: list[dict] = Field(default_factory=list)


class HarmonizationRequest(BaseModel):
    text: str = Field(min_length=2, max_length=10000)
    category: str | None = None
    material_id: UUID | None = None


class HarmonizationApplyRequest(BaseModel):
    material_id: UUID
    harmonized_title: str
    harmonized_category: str
    taxonomy_node_code: str | None = None
    attributes: dict[str, str] = Field(default_factory=dict)

