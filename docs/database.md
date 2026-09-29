# Database schema

PostgreSQL 16 with pgvector is the deployment target. UUIDs are generated server-side. JSON fields use PostgreSQL JSONB; the embedding column uses `vector(384)`. SQLAlchemy substitutes portable JSON for local SQLite tests.

| Table | Purpose / relationships |
|---|---|
| organizations | Source organization code and description |
| users | Unique email, Argon2 password hash, role, organization, active state |
| datasets | Organization, uploader, source rows, mapping, validation report and import status |
| materials | Organization, dataset, original legacy code and description, normalized description, category, revision, quality and embedding |
| material_attributes | Unique material/attribute pairs; raw and canonical value, unit, confidence, evidence foreign key and validation state |
| evidence | Material, source file/type, row/page, quoted text, extracted value, method and confidence |
| material_candidates | Unique ordered material pair; similarity and engineering scores; review status |
| engineering_comparisons | Attribute comparisons linked to both candidate and immutable decision snapshot |
| decisions | Four-way recommendation, reason, actor, source and material/rule-version snapshot |
| reviews | Append-only action/comment linked to a decision and reviewer |
| common_material_identities | Unique NMC code, canonical name, category, canonical JSON attributes and publication status |
| legacy_code_mappings | One identity per material, original organization, mapping type and verification flag |
| engineering_rules | Category, attribute, exact/numeric comparison, tolerance, severity, active flag, version |
| audit_logs | Who, action, entity, previous/new JSON, timestamp, reason |
| dictionary_entries | Versioned, category-scoped term expansion for abbreviation/synonym/standard/OEM |
| benchmark_runs | Uploader, fixture filename, pair count, provider and computed metrics |

Uniqueness constraints protect source codes within organizations, attribute names within materials, material pairs, user emails, common codes and single-identity memberships. Foreign keys protect references. No API deletes original codes, evidence, decisions, reviews or audit logs. Rule edits increment version and preserve the prior representation in the audit record. Material edits increment revision.

The review transaction locks the candidate and identity-member materials in PostgreSQL. If two different identities are encountered, consolidation is rejected. A new member must match existing canonical attributes; no unchecked transitive identity merge is allowed. ID codes use category plus a random 48-bit suffix and a database uniqueness constraint instead of a race-prone count-based sequence. A rare collision is rejected transactionally, never overwritten.

An initial Alembic revision creates the schema and extension. Subsequent deployments should add explicit immutable migrations; the bootstrap revision currently imports the model metadata. Database backups, role separation, audit-retention policy and ANN indexes are production deployment work.

For test isolation use a dedicated `TEST_DATABASE_URL`. Default pytest databases are temporary SQLite files. Never set the test URL to a real material catalog.
