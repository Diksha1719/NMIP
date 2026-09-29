"""Initial normalized NMIP schema, PostgreSQL JSONB and vector support."""
from alembic import op
from app.db import Base
import app.models

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    Base.metadata.create_all(connection)


def downgrade():
    Base.metadata.drop_all(op.get_bind())
