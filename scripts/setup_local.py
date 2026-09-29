"""Create ignored local/demo configurations without overwriting existing files."""
import os
import re
import secrets
from pathlib import Path

root = Path(__file__).resolve().parents[1]
password = os.environ.get("DEMO_PASSWORD") or re.search(r"password \*\*`([^`]+)`\*\*", (root / "README.md").read_text(encoding="utf-8"))[1]
jwt_secret = secrets.token_urlsafe(48)
db_password = secrets.token_urlsafe(24)
common = f"JWT_SECRET={jwt_secret}\nCORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000\nCOOKIE_SECURE=false\nEMBEDDING_PROVIDER=deterministic\nSEED_DEMO=true\nDEMO_PASSWORD={password}\n"
files = {
    root / ".env": f"POSTGRES_USER=nmip\nPOSTGRES_PASSWORD={db_password}\nPOSTGRES_DB=nmip\nDATABASE_URL=postgresql+psycopg://nmip:{db_password}@postgres:5432/nmip\nAPI_INTERNAL_URL=http://backend:8000\n" + common,
    root / "backend" / ".env": "DATABASE_URL=sqlite:///./nmip-local.db\n" + common,
    root / "frontend" / ".env.local": "API_INTERNAL_URL=http://127.0.0.1:8000\n",
}
for path, content in files.items():
    if path.exists():
        print(f"Preserved {path.relative_to(root)}")
    else:
        path.write_text(content, encoding="utf-8")
        print(f"Created {path.relative_to(root)}")
