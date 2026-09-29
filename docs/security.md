# Security model and deployment boundary

- Passwords use Argon2 via pwdlib. No plaintext password is stored in a database user row. Demo setup secrets live only in ignored environment files and the README's development instructions.
- JWTs expire after eight hours; cookie is HttpOnly, SameSite=Lax, optionally Secure. Use HTTPS and COOKIE_SECURE=true outside local development. Active status and role are loaded from the database on every authenticated request.
- State-changing browser requests with an untrusted Origin are rejected. Exact CORS origins are configured server-side. The Next.js same-origin proxy forwards only content type, session cookie, authorization and origin.
- API dependencies enforce role permissions independently of whether UI controls are visible. Viewers cannot ingest, alter rules, create materials, or review decisions.
- SQLAlchemy parameter binding prevents user input from becoming raw SQL. Pydantic validates write bodies, numeric rule tolerance and UUID paths. Constraint conflicts return a safe 409 message.
- Upload types and sizes are limited; XLSX expanded ZIP sizes are checked. UTF-8 CSV and selectable PDF text are supported. No uploaded filename is used as a filesystem destination, and spreadsheet formulas are not evaluated.
- Audit entries bind to the same transaction as consequential actions. Old descriptions, rule versions and decisions remain explainable. There is no API for deleting audit history.
- Global errors are generic for users and logged server-side. Response headers disable MIME sniffing and frame embedding; authenticated API responses are not cached.
- The in-process login limiter allows ten attempts per IP/email per five minutes. Deploy shared rate limiting, SSO/MFA, session invalidation and monitoring for production.

This is a shared national catalog. Organization membership identifies provenance, not an enforced confidentiality boundary. Private tenant partitioning is not implemented. External ERP/AI/OCR providers are not contacted by default. Documents remain user-provided or synthetic; no public material data is claimed.

Before real data: provision TLS, least-privilege database accounts, managed secrets and key rotation, persistent object storage, malware scanning, backups/restore drills, centralized logs, independent immutable audit retention and security review. The synchronous local prototype must not be treated as a hardened national deployment.
