import os
import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

os.environ.setdefault("JWT_SECRET", "automated-test-secret-at-least-32-characters")
from app.db import Base, get_db
from app.main import app, attempts
from seed import seed


@pytest.fixture(scope="session")
def database(tmp_path_factory):
    url = os.environ.get("TEST_DATABASE_URL") or "sqlite:///" + str(tmp_path_factory.mktemp("nmip") / "test.db")
    engine = create_engine(url, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})
    if not url.startswith("sqlite"):
        from sqlalchemy import text
        with engine.begin() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as session:
        seed(session, "TestOnlyPassword-123!")
    yield factory
    engine.dispose()


@pytest.fixture
def client(database):
    def override():
        with database() as session:
            try:
                yield session
                session.commit()
            except Exception:
                session.rollback()
                raise
    app.dependency_overrides[get_db] = override
    attempts.clear()
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def login(client):
    def do(role="admin"):
        result = client.post("/api/auth/login", json={"email": f"{role}@nmip.local", "password": "TestOnlyPassword-123!"})
        assert result.status_code == 200, result.text
        return result
    return do
