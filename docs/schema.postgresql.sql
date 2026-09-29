BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 001

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE organizations (
    name VARCHAR(200) NOT NULL, 
    code VARCHAR(30) NOT NULL, 
    description TEXT NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (code)
);

CREATE TABLE engineering_rules (
    category VARCHAR(100) NOT NULL, 
    attribute_name VARCHAR(100) NOT NULL, 
    rule_type VARCHAR(30) NOT NULL, 
    rule_definition JSONB NOT NULL, 
    severity VARCHAR(30) NOT NULL, 
    is_active BOOLEAN NOT NULL, 
    version INTEGER NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id)
);

CREATE TABLE dictionary_entries (
    term VARCHAR(100) NOT NULL, 
    expansion VARCHAR(200) NOT NULL, 
    kind VARCHAR(40) NOT NULL, 
    category VARCHAR(100) NOT NULL, 
    version INTEGER NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (term)
);

CREATE TABLE users (
    name VARCHAR(200) NOT NULL, 
    email VARCHAR(250) NOT NULL, 
    password_hash TEXT NOT NULL, 
    role VARCHAR(30) NOT NULL, 
    organization_id UUID, 
    is_active BOOLEAN NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (email), 
    FOREIGN KEY(organization_id) REFERENCES organizations (id)
);

CREATE TABLE datasets (
    organization_id UUID NOT NULL, 
    name VARCHAR(250) NOT NULL, 
    source_type VARCHAR(20) NOT NULL, 
    filename VARCHAR(250) NOT NULL, 
    status VARCHAR(30) NOT NULL, 
    row_count INTEGER NOT NULL, 
    valid_rows INTEGER NOT NULL, 
    invalid_rows INTEGER NOT NULL, 
    uploaded_by UUID NOT NULL, 
    source_rows JSONB NOT NULL, 
    column_mapping JSONB NOT NULL, 
    validation_report JSONB NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(organization_id) REFERENCES organizations (id), 
    FOREIGN KEY(uploaded_by) REFERENCES users (id)
);

CREATE TABLE common_material_identities (
    nmip_code VARCHAR(50) NOT NULL, 
    canonical_name TEXT NOT NULL, 
    category VARCHAR(100) NOT NULL, 
    canonical_attributes JSONB NOT NULL, 
    status VARCHAR(30) NOT NULL, 
    created_by UUID NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (nmip_code), 
    FOREIGN KEY(created_by) REFERENCES users (id)
);

CREATE TABLE audit_logs (
    user_id UUID, 
    action VARCHAR(100) NOT NULL, 
    entity_type VARCHAR(100) NOT NULL, 
    entity_id VARCHAR(100) NOT NULL, 
    previous_value JSONB, 
    new_value JSONB, 
    reason TEXT NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE benchmark_runs (
    uploaded_by UUID NOT NULL, 
    filename VARCHAR(250) NOT NULL, 
    row_count INTEGER NOT NULL, 
    metrics JSONB NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(uploaded_by) REFERENCES users (id)
);

CREATE TABLE materials (
    organization_id UUID NOT NULL, 
    dataset_id UUID, 
    legacy_material_code VARCHAR(120) NOT NULL, 
    original_description TEXT NOT NULL, 
    normalized_description TEXT NOT NULL, 
    category VARCHAR(100) NOT NULL, 
    subcategory VARCHAR(100) NOT NULL, 
    status VARCHAR(30) NOT NULL, 
    data_quality_score FLOAT NOT NULL, 
    embedding VECTOR(384), 
    revision INTEGER NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (organization_id, legacy_material_code), 
    FOREIGN KEY(organization_id) REFERENCES organizations (id), 
    FOREIGN KEY(dataset_id) REFERENCES datasets (id)
);

CREATE TABLE evidence (
    material_id UUID NOT NULL, 
    source_type VARCHAR(30) NOT NULL, 
    source_file VARCHAR(250) NOT NULL, 
    page_number INTEGER, 
    row_number INTEGER, 
    source_text TEXT NOT NULL, 
    extracted_value TEXT, 
    evidence_type VARCHAR(50) NOT NULL, 
    confidence FLOAT NOT NULL, 
    extraction_method VARCHAR(20) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(material_id) REFERENCES materials (id)
);

CREATE INDEX ix_evidence_material_id ON evidence (material_id);

CREATE TABLE material_candidates (
    material_a_id UUID NOT NULL, 
    material_b_id UUID NOT NULL, 
    semantic_score FLOAT NOT NULL, 
    fuzzy_score FLOAT NOT NULL, 
    attribute_score FLOAT NOT NULL, 
    engineering_score FLOAT NOT NULL, 
    final_score FLOAT NOT NULL, 
    status VARCHAR(30) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (material_a_id, material_b_id), 
    FOREIGN KEY(material_a_id) REFERENCES materials (id), 
    FOREIGN KEY(material_b_id) REFERENCES materials (id)
);

CREATE TABLE legacy_code_mappings (
    common_material_id UUID NOT NULL, 
    organization_id UUID NOT NULL, 
    material_id UUID NOT NULL, 
    mapping_type VARCHAR(30) NOT NULL, 
    verified BOOLEAN NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(common_material_id) REFERENCES common_material_identities (id), 
    FOREIGN KEY(organization_id) REFERENCES organizations (id), 
    UNIQUE (material_id), 
    FOREIGN KEY(material_id) REFERENCES materials (id)
);

CREATE TABLE material_attributes (
    material_id UUID NOT NULL, 
    attribute_name VARCHAR(100) NOT NULL, 
    raw_value TEXT, 
    normalized_value TEXT, 
    unit VARCHAR(30), 
    confidence FLOAT NOT NULL, 
    source_evidence_id UUID, 
    validation_status VARCHAR(30) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (material_id, attribute_name), 
    FOREIGN KEY(material_id) REFERENCES materials (id), 
    FOREIGN KEY(source_evidence_id) REFERENCES evidence (id)
);

CREATE INDEX ix_material_attributes_material_id ON material_attributes (material_id);

CREATE TABLE decisions (
    candidate_id UUID NOT NULL, 
    decision_type VARCHAR(40) NOT NULL, 
    decision_score FLOAT NOT NULL, 
    reason TEXT NOT NULL, 
    confidence FLOAT NOT NULL, 
    decided_by UUID, 
    decision_source VARCHAR(30) NOT NULL, 
    snapshot JSONB NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(candidate_id) REFERENCES material_candidates (id), 
    FOREIGN KEY(decided_by) REFERENCES users (id)
);

CREATE INDEX ix_decisions_candidate_id ON decisions (candidate_id);

CREATE TABLE engineering_comparisons (
    candidate_id UUID NOT NULL, 
    decision_id UUID NOT NULL, 
    attribute_name VARCHAR(100) NOT NULL, 
    value_a TEXT, 
    value_b TEXT, 
    comparison_result VARCHAR(30) NOT NULL, 
    criticality VARCHAR(30) NOT NULL, 
    tolerance FLOAT NOT NULL, 
    explanation TEXT NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(candidate_id) REFERENCES material_candidates (id), 
    FOREIGN KEY(decision_id) REFERENCES decisions (id)
);

CREATE TABLE reviews (
    decision_id UUID NOT NULL, 
    reviewer_id UUID NOT NULL, 
    action VARCHAR(30) NOT NULL, 
    comment TEXT NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(decision_id) REFERENCES decisions (id), 
    FOREIGN KEY(reviewer_id) REFERENCES users (id)
);

INSERT INTO alembic_version (version_num) VALUES ('001') RETURNING alembic_version.version_num;

COMMIT;

