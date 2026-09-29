# NMIP architecture and implementation contract

Browser → Next.js App Router → same-origin REST proxy → FastAPI → SQLAlchemy → PostgreSQL + pgvector.

The browser owns presentation and form state. Backend services own normalization, extraction, retrieval, engineering comparisons, decisions, review, identity publication and duplicate checks. Transactions bind consequential changes to append-only audit records. The database preserves original descriptions, evidence and legacy codes.

## Project structure

- `frontend/src/app`: route composition and Next.js proxy
- `frontend/src/features`: dashboard, explorer, ingestion, comparison and administration
- `frontend/src/components`: application shell and UI primitives
- `frontend/src/services`: typed API client
- `backend/app/models`: relational persistence
- `backend/app/schemas`: Pydantic contracts
- `backend/app/api`: authenticated REST routes
- `backend/app/services`: transactional workflows
- `backend/app/normalization`, `extraction`, `matching`, `rules`, `ai`: replaceable processing boundaries
- `backend/alembic`: schema revisions
- `backend/tests`: safety invariants and API integration
- `samples`: synthetic import and benchmark fixtures

## Core contracts (before implementation)

All resource identifiers are UUIDs; timestamps are UTC. Login accepts email/password and sets an HttpOnly JWT cookie. Read routes require authentication. Steward/admin may ingest and correct records; engineer/admin may review; only admin may change rules, dictionaries or users. Organization records form a deliberately shared national catalog, not private tenants.

Ingestion uses upload → preview → column mapping → persisted validation → import. Invalid rows remain in the report and cannot enter the catalog. Source codes are unique per organization. Material processing attaches attribute-level evidence. Candidate retrieval returns ranked records, never an approval. A decision snapshot records rule versions and material revisions. Approval rechecks freshness and engineering constraints within a transaction. Only an approved IDENTITY_MATCH can create identity mappings. Published identity mappings preserve source codes.

## Safety order

1. Critical conflict → DO_NOT_MERGE.
2. Missing critical value or evidence → INSUFFICIENT_INFORMATION.
3. All critical values supported, applicable category rules, no differing known attributes → IDENTITY_MATCH recommendation.
4. Critical alignment with noncritical differences → POTENTIAL_SUBSTITUTE.
5. Otherwise abstain.

Scores rank retrieval only. A substitute approval never creates an identity. Engineering equality describes the configured prototype rule scope, not a real-world certification. The local embedding provider is explicitly deterministic and is not a trained semantic model.

## Delivery boundary

Docker is the primary runtime. SQLite is allowed only for fast portable tests/local demonstration; PostgreSQL is the target and has a separate integration test command. Seed records and benchmark fixtures are explicitly synthetic. No fabricated performance metrics or savings are displayed.
