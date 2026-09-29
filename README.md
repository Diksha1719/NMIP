# NMIP — National Material Intelligence Platform

**Different Codes. Verified Identities. No Blind Merges.**

A functional, production-style **prototype** for material identity governance. Next.js provides the working interface; FastAPI owns decisions and workflows; SQLAlchemy persists source materials, evidence, engineering rules, reviews, common identities and audit history. PostgreSQL with pgvector is the deployment target. All supplied organization/material data is **synthetic**, not real CPSE data.

**Deployment:** Follow [the deployment guide](docs/deployment.md) for Docker Compose, HTTPS configuration, demo accounts, first-run data import, and verification limitations.

**Repository layout:** `frontend/` contains the Next.js app; `backend/` contains the FastAPI API, migrations, and tests; `docs/` contains technical guides; `samples/` contains import and benchmark CSVs; `scripts/` contains local configuration setup. Local secrets, databases, dependencies, and build outputs are intentionally excluded from Git.

## Quick start with Docker

Prerequisites: Docker Desktop with the Linux engine running, Docker Compose v2, and ports 3000/8000 available.

1. Copy `.env.example` to `.env`.
2. Replace `POSTGRES_PASSWORD` and the password in `DATABASE_URL` with the same local database password. URL-encode reserved characters in connection URLs.
3. Set `JWT_SECRET` to a random value of at least 32 characters. Set `DEMO_PASSWORD` to the demo password below or a different strong password. Keep `SEED_DEMO=true` for the demonstration.
4. Run:

```sh
docker compose up --build -d
docker compose logs -f backend
```

The backend waits for PostgreSQL, runs `alembic upgrade head`, seeds once if enabled, and starts the API. Open [NMIP](http://localhost:3000). The database persists in the `nmip_postgres` volume. Repeated starts do not recreate demo accounts or duplicate seed records.

API reference: [Swagger UI](http://localhost:8000/docs), [ReDoc](http://localhost:8000/redoc), [OpenAPI JSON](http://localhost:8000/openapi.json).

Do not run `docker compose down -v` unless you intend to permanently delete the local database. `docker compose down` alone preserves it.

## Demo accounts

For the provided local setup, all four synthetic accounts use the password **`Nmip-Demo-2026!`**. Passwords are Argon2-hashed before storage. Password changes in the environment do not reset already seeded users.

| Email | Role | Capabilities |
|---|---|---|
| admin@nmip.local | ADMIN | All workflows, users, engineering rules, knowledge dictionary |
| engineer@nmip.local | ENGINEER | Retrieve, compare, inspect evidence, approve/reject/request information, supply evidence, publish, benchmark |
| steward@nmip.local | DATA_STEWARD | Upload, map, validate, import, normalize/extract/enrich, correct unverified sources, create with audited duplicate override |
| viewer@nmip.local | VIEWER | Catalog, comparisons, identities, analytics, audit, benchmark results; no consequential write actions |

The brief's final flow asks an engineer to upload while its permission table reserves uploads for stewards. This implementation follows the permission table: use Steward for ingestion and Engineer for review, or Admin for one-account demonstrations.

## Local development on Windows

Prerequisites: Python 3.12+ (verified on 3.14), Node.js 22+ (verified on 24), npm, and optionally PostgreSQL 16+ with pgvector. A portable SQLite demonstration mode is included when Docker is unavailable. SQLite is not the production database.

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend/requirements.txt
python scripts/setup_local.py
Set-Location backend
..\.venv\Scripts\python -m alembic upgrade head
..\.venv\Scripts\python seed.py
..\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open [local NMIP](http://127.0.0.1:3000). `setup_local.py` writes ignored environment files with generated secrets. It obtains the demonstration password from this README or a supplied `DEMO_PASSWORD` environment variable. Existing env files are preserved. The local database is `backend/nmip-local.db`. The root `.env` uses PostgreSQL for Docker; `backend/.env` uses SQLite for local processes. Do not commit either file.

On Linux/macOS, replace `.venv\Scripts\python` with `.venv/bin/python`; `python scripts/setup_local.py` works cross-platform.

To use local PostgreSQL, create a database with `CREATE EXTENSION vector`, change `backend/.env` `DATABASE_URL` to `postgresql+psycopg://USER:PASSWORD@localhost:5432/nmip`, then migrate and seed. The extension creation step requires a sufficiently privileged database owner on initial bootstrap; use a restricted runtime account after deployment provisioning.

## Environment variables

| Variable | Purpose |
|---|---|
| DATABASE_URL | Server-side SQLAlchemy connection string; never sent to the browser |
| JWT_SECRET | Required, minimum 32 characters; rotate securely in production |
| CORS_ORIGINS | Comma-separated exact frontend origins; also checked for state-changing browser requests |
| COOKIE_SECURE | `false` for local HTTP only; `true` with HTTPS |
| EMBEDDING_PROVIDER | `deterministic` by default or `sentence-transformer` |
| SENTENCE_TRANSFORMER_MODEL | Default `all-MiniLM-L6-v2`; must output 384 dimensions |
| SEED_DEMO | `true` enables first-run synthetic bootstrap in Docker |
| DEMO_PASSWORD | Required to create demo accounts; never used after initial seed |
| API_INTERNAL_URL | Next.js server-to-API URL; `http://backend:8000` in Docker |
| POSTGRES_USER / PASSWORD / DB | PostgreSQL container bootstrap |
| TEST_DATABASE_URL | Optional disposable PostgreSQL database for integration tests |

## Architecture and project structure

```text
Browser → Next.js REST proxy → FastAPI → PostgreSQL + pgvector
                                 ├── provider interfaces
                                 ├── normalization / extraction
                                 ├── hybrid matching / engineering rules
                                 └── review / identity / audit services

backend/
  app/
    api/            REST catalog and administration routes
    auth/           Argon2, JWT, current-user and RBAC dependencies
    models/         Normalized SQLAlchemy schema
    schemas/        Validated Pydantic write contracts
    repositories/   Record access and safe serialization
    services/       Material processing, ingestion, review, benchmark
    normalization/  Units, terms, casing, whitespace
    extraction/     Evidence-preserving category extraction
    matching/       Hybrid retrieval, duplicate check, decisions
    rules/          Pure deterministic comparison and decision functions
    ai/             EmbeddingProvider and LLMProvider interfaces
    audit/          Transaction-bound audit events
  alembic/          Versioned migrations
  tests/            Safety and workflow integration tests
  seed.py           Idempotent synthetic bootstrap
frontend/
  src/app/          App Router, login, routes, same-origin API proxy
  src/features/     Dashboard, materials, ingestion, candidates, governance, admin
  src/components/   Navigation, providers, accessible UI primitives
  src/hooks/        Mutation/loading/error handling
  src/services/     API client
  src/types/        Frontend types
  tests/            Playwright workflow and role/layout checks
docs/               Architecture, database, API, AI, decisions, security, demo
samples/            Synthetic import and labeled benchmark CSV
scripts/            Local configuration helper
docker-compose.yml  Frontend, backend, PostgreSQL, persistent data volume
```

## Database summary

UUID primary keys identify organizations, users, datasets, materials, attributes, evidence, candidates, comparison snapshots, decisions, reviews, identities, legacy mappings, engineering rules, audit logs, dictionary entries and benchmark runs. Attributes are extensible rows; criticality comes from category rules. PostgreSQL stores document-shaped metadata as JSONB and 384-dimensional embeddings with pgvector. Source code uniqueness is enforced per organization; one material can belong to at most one identity. See [database documentation](docs/database.md).

## Working features

- Backend-validated JWT login in an HttpOnly cookie; active-user checks and four roles.
- 60 seeded materials across CPSE-A/B/C and Valves, Bearings, Pumps, Fasteners, Electrical.
- CSV/XLSX preview, column mapping, row-level validation and downloadable reports; only valid rows import.
- Text PDF/TXT extraction with source page/row provenance. Scanned PDF OCR is not included. Unstructured files without codes/categories must be structured before import; the API never invents codes.
- Source-preserving normalization, category extraction, configurable terminology dictionary, evidence per extracted attribute, missing-value abstention.
- Hybrid fuzzy, embedding and attribute candidate ranking with same-category filtering. Deterministic local embeddings are explicitly labeled; no external AI account is needed.
- Four engineering outcomes with critical conflict precedence; evidence comparison and human review.
- Approved identity creation, canonical attributes, immutable source-code links, catalog publication and JSON mapping export.
- Pre-creation duplicate comparison, role-gated reasoned overrides and audit events.
- Material revision and rule version checks reject stale approvals; evidence corrections rerun decisions.
- Database-driven metrics, category/organization/review charts, data completeness, activity and audit change records.
- Labeled benchmark uploads calculate metrics; without a run the Proof Board says “Awaiting benchmark dataset.”
- Rule and user administration, knowledge-dictionary updates, responsive navigation and evidence drawer.

## Demo workflow

See [demo script](docs/demo.md) for the complete sequence. Start with `samples/synthetic_import.csv`: six valid rows and three deliberate errors. Use `samples/benchmark.csv` to exercise all decision outcomes. The generic-stainless bolt example correctly abstains until its material grade is supplied; generic Stainless Steel is not evidence of SS304.

## Testing

```powershell
Set-Location backend
..\.venv\Scripts\python -m pytest -q
Set-Location ../frontend
npm run build
npm run typecheck
```

The API tests use a temporary SQLite database by default and seed their own test-only credentials. To run the same suite on PostgreSQL, set `TEST_DATABASE_URL` to a **new disposable database** with pgvector available. Never point tests at a real catalog: they create synthetic users and materials and leave their tables in that test database.

Browser tests require a **freshly seeded demo instance** and running frontend/backend. Set `DEMO_PASSWORD` to the seeded password, then:

```powershell
Set-Location frontend
npm run test:e2e
```

The default Playwright channel is installed Microsoft Edge. Set `E2E_BROWSER=chrome` for Chrome, or configure Playwright's bundled Chromium and install it with `npx playwright install chromium`. `E2E_BASE_URL` defaults to `http://127.0.0.1:3000`. Tests create real datasets, approve a match, publish an identity and run a benchmark. Use a disposable demo database. Reports go to `frontend/playwright-report`; screenshots/traces go to `frontend/test-results`.

## Connecting a production AI model

1. Start with the deterministic provider and build a representative labeled engineering evaluation set.
2. For local sentence embeddings, install `backend/requirements-ml.txt` under Python 3.12 and set `EMBEDDING_PROVIDER=sentence-transformer`. Pre-download and pin the model in deployment; the default model outputs 384 dimensions.
3. For a different vendor implement `EmbeddingProvider.embed_text` / `embed_batch` in `backend/app/ai/` and select it in the provider factory. Supply API keys only via backend environment/secret management. Keep vector dimensions consistent or add a schema migration.
4. Rebuild **every material embedding** using one provider/model version. Do not mix incompatible vectors. The prototype bulk extraction path skips verified materials, so a production migration must explicitly rebuild embeddings without modifying their verified engineering attributes.
5. Implement `LLMProvider.extract_attributes` and `explain_decision`. Require structured values, cited source spans, confidence, method and null for absence. Validate citations against stored documents before saving any attribute. Unsupported model output must remain missing. Explanations must summarize the already-computed deterministic decision and cannot change it.
6. Add timeout/retry/rate-limit handling, usage observability and provider health checks. Run the benchmark and critical-conflict regression suite before enabling model output for users.
7. Keep human approval and database engineering rules unchanged. A model cannot turn a substitute into an identity or bypass critical conflicts.

## Known limitations and production hardening

- This is a bounded synchronous prototype, not a certified engineering or procurement system. Its configured demo attributes do not cover every valve/pump/fastener standard or application-specific constraint.
- Retrieval scans same-category records in Python. pgvector persists embeddings, but ANN indexes/server-side vector retrieval and async jobs are needed at national scale. API lists also need pagination and query optimization at scale.
- Local embedding scores are token-hash cosine similarity, not a trained semantic model or calibrated confidence. Attribute completeness is not probability of correctness.
- PDF/TXT is text extraction only; source text and locations persist, not the original uploaded binary. OCR, object storage, malware scanning and complex table extraction are future extensions.
- Noncritical differences produce a **potential** substitute; suitability requires application-specific engineering validation beyond this prototype.
- Verified material records cannot be edited through normal processing. Full governed split/revoke/correct-identity workflows are not implemented. Existing distinct identities cannot be silently consolidated.
- Publication is to the NMIP catalog; external ERP sync uses exported JSON only. No external system is called or claimed synchronized.
- Role permissions cover a shared national catalog. Organization-specific confidentiality, SSO/MFA, distributed rate limiting, session revocation, security monitoring, backups and immutable external audit retention are required before production.
- The first migration bootstraps the model metadata. Future schema changes should be explicit immutable Alembic revisions; do not alter a deployed initial schema revision.
- Benchmark metrics apply only to uploaded pairs. Top-5 retrieval uses same-category labeled B descriptions as its corpus. No costs, savings or real-world accuracy are fabricated.
- Docker/PostgreSQL runtime verification depends on a working local Docker Linux engine. See `docs/verification.md` for the actual checks run in this workspace.

## Troubleshooting

**API unavailable:** start FastAPI from `backend/`, check `/health`, and verify `API_INTERNAL_URL`. Environment files load relative to the process working directory.

**JWT configuration error:** provide a random secret of 32+ characters before importing the application or running migrations. No insecure fallback secret exists.

**Login rejected:** verify the initial `DEMO_PASSWORD`, confirm seeding completed, and use the documented email. Rerunning seed does not reset an existing account.

**Docker named pipe missing:** start Docker Desktop, enable the Linux engine/WSL2 backend, wait until the engine reports running, then retry `docker info` and `docker compose up --build`.

**Stale decision:** a material or rule version changed; reopen the candidate and use “Rerun decision” before review. The old decision remains in the database/audit history.

**Duplicate source code:** each organization can use a legacy code only once. Change the input code or inspect the existing material. Overrides permit a distinct source code, not violating source-code uniqueness.

**Import button unavailable:** supply code, description and category mappings and validate. Invalid rows are retained in the validation report and excluded from import.

**npm cache permission errors:** run dependency installation with the appropriate local permissions. Do not change system security settings.

**Model package errors on newest Python:** use Python 3.12 for optional Sentence Transformers/PyTorch; they are intentionally separate from the base requirements.
