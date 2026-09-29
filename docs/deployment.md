# Deploy NMIP

NMIP needs a Next.js server, a FastAPI server, and a persistent PostgreSQL database with pgvector. It is not a static site and cannot run on GitHub Pages. The repository includes Dockerfiles and Docker Compose configuration for all three services.

## Run on a Docker host

Install Docker with Compose and Git, then run:

```sh
git clone https://github.com/omkardesai168-oss/NMIP-SIH.git
cd NMIP-SIH
cp .env.example .env
```

Edit `.env` before starting:

- Set `POSTGRES_PASSWORD` to a new database password and use the same password in `DATABASE_URL` (URL-encode reserved characters).
- Set `JWT_SECRET` to a random value of at least 32 characters. For example, generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- For local access, set `CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000` and keep `COOKIE_SECURE=false`.
- Keep `SEED_DEMO=true` and `DEMO_PASSWORD=Nmip-Demo-2026!` for the public synthetic demonstration. That password is displayed on the login page.

```sh
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 backend frontend
```

Open `http://localhost:3000`. The backend health endpoint is `http://localhost:8000/health`. Compose waits for PostgreSQL and the API to become healthy before starting the frontend. Database tables are migrated and demo accounts are seeded automatically on first start.

## Public HTTPS access

Point your domain at the Docker host and configure your host's HTTPS reverse proxy to forward requests to `127.0.0.1:3000`. The Compose ports are deliberately bound to localhost; the reverse proxy provides public access. Keep PostgreSQL and the backend private.

Set `CORS_ORIGINS` to your exact frontend origin, for example `https://nmip.example.com`, with no trailing slash, and set `COOKIE_SECURE=true`. Recreate the backend after configuration changes:

```sh
docker compose up -d --force-recreate backend
```

`API_INTERNAL_URL=http://backend:8000` is set by Compose for the frontend. Browser API requests go through Next.js to the backend, including authentication cookies. No browser-facing backend URL is needed. Allow upload requests of at least 11 MB through your reverse proxy.

For a platform that builds each service separately, use `frontend/` and `backend/` as their build contexts. Set the frontend's `API_INTERNAL_URL` to the reachable backend address. Set the backend's `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `COOKIE_SECURE`, `SEED_DEMO`, and `DEMO_PASSWORD` in the platform's environment settings. Ensure the database supports the `vector` extension and migrations can create it. The frontend listens on port 3000; the API listens on 8000.

## Judge walkthrough and initial data

The login page lists Admin, Engineer, Data Steward, and Viewer accounts. All use `Nmip-Demo-2026!` in the supplied demo configuration. Selecting a role fills both credentials. Admin can demonstrate all workflows; Engineer can submit human reviews; Viewer offers read-only access.

The current seed creates accounts, three organizations, taxonomy, dictionaries, and engineering rules. **It does not create material records or candidates.** The local development database is not uploaded to GitHub.

After a fresh deployment:

1. Sign in as Admin or Data Steward.
2. Open Data ingestion and upload `samples/synthetic_import.csv` under a demo organization.
3. Validate the mapping and import the valid rows. Some sample rows intentionally demonstrate validation errors.
4. Run Normalization and Attribute extraction, then retrieve candidates in Candidate center.
5. Sign in as Engineer or Admin and open Review queue. Use **Human review** to inspect evidence and submit a decision, or **Rerun engine** to recalculate a recommendation.
6. Upload `samples/benchmark.csv` in Proof Board to calculate benchmark metrics.

The sample import demonstrates a subset of outcomes. Add source-backed material pairs when demonstrating other outcomes. Shared demo accounts operate on the same persistent catalog.

## Persistence and updates

PostgreSQL data persists in the `nmip_postgres` Docker volume. Back it up before upgrades. `docker compose down` preserves the volume; `docker compose down -v` deletes it. Changing `DEMO_PASSWORD` does not reset existing accounts.

```sh
git pull --ff-only
docker compose up --build -d
```

## Verification at initial publication

- The production frontend build passed locally.
- The review queue's three mocked browser regression tests passed.
- Backend tests: 15 passed and 7 failed. The failing integration scenarios depend on a historical 60-material seed dataset that the current seed no longer creates; they require fixture restoration before the entire suite can pass.
- Docker configuration can be validated locally, but full container startup was not tested because the local Docker daemon was not running.

The older demo walkthrough describes the historical populated dataset. Use the first-run steps above for this repository's current seed behavior.
