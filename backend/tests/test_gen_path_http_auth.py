"""
HTTP-level test for gen_path auth + ownership, against a REAL postgres DB.

Runs the actual FastAPI app with TestClient:
  - no token             -> 401
  - wrong token          -> 401
  - user A cannot see or
    delete user B's project -> 404
  - user A sees only own projects
"""
import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.db.database import Base, engine
from app.curd.gen_path_curd import GenPathCURD
from app.auth import create_access_token


@pytest.fixture(scope="module", autouse=True)
def _schema():
    from app.main import app as _app  # noqa: F401  (registers all models)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def db():
    with Session(engine) as session:
        yield session


@pytest.fixture()
def users(db):
    from app.models.rbac.user import User

    a = User(username="http_alice", email="http_alice@audit.local", hashed_password="x")
    b = User(username="http_bob", email="http_bob@audit.local", hashed_password="x")
    db.add_all([a, b])
    db.commit()
    db.refresh(a)
    db.refresh(b)
    yield a, b
    db.query(User).filter(User.username.in_(["http_alice", "http_bob"])).delete()
    db.commit()


def _token(user):
    return create_access_token(str(user.id))


class TestGenPathHTTPAuth:
    def test_endpoints_require_authentication(self, client):
        for method, url in [
            ("get", "/gen-path/projects"),
            ("delete", "/gen-path/projects/whatever"),
            ("post", "/gen-path/summary?project_id=whatever"),
        ]:
            resp = getattr(client, method)(url)
            assert resp.status_code == 401, f"{method} {url} -> {resp.status_code}"

    def test_bogus_token_is_rejected(self, client):
        resp = client.get(
            "/gen-path/projects",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert resp.status_code == 401

    def test_user_cannot_see_other_users_projects(self, client, db, users):
        alice, bob = users
        GenPathCURD.create(db, topic="bob-secret", user_id=bob.id)

        resp = client.get(
            "/gen-path/projects",
            headers={"Authorization": f"Bearer {_token(alice)}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 0
        assert body["projects"] == []

        resp = client.get(
            "/gen-path/projects",
            headers={"Authorization": f"Bearer {_token(bob)}"},
        )
        assert resp.json()["total"] == 1
        assert resp.json()["projects"][0]["topic"] == "bob-secret"

    def test_user_cannot_read_other_users_project_by_id(self, client, db, users):
        alice, bob = users
        project = GenPathCURD.create(db, topic="bob-private", user_id=bob.id)

        resp = client.get(
            f"/gen-path/projects/{project['id']}",
            headers={"Authorization": f"Bearer {_token(alice)}"},
        )
        assert resp.status_code == 404

        resp = client.get(
            f"/gen-path/projects/{project['id']}",
            headers={"Authorization": f"Bearer {_token(bob)}"},
        )
        assert resp.status_code == 200

    def test_user_cannot_delete_other_users_project(self, client, db, users):
        alice, bob = users
        project = GenPathCURD.create(db, topic="bob-doomed", user_id=bob.id)

        resp = client.delete(
            f"/gen-path/projects/{project['id']}",
            headers={"Authorization": f"Bearer {_token(alice)}"},
        )
        assert resp.status_code == 404

        # still there
        row = db.execute(
            text("SELECT id FROM gen_path_projects WHERE id = :id"),
            {"id": project["id"]},
        ).fetchone()
        assert row is not None

        # owner can
        resp = client.delete(
            f"/gen-path/projects/{project['id']}",
            headers={"Authorization": f"Bearer {_token(bob)}"},
        )
        assert resp.status_code == 200
        assert resp.json() == {"success": True}


class TestSectionOwnership:
    """`project_id` and `section_id` are independent request fields — a caller
    must not be able to point at somebody else's section."""

    def _seed(self, db, users):
        from app.curd.gen_path_curd import GenPathSection

        alice, bob = users
        bob_project = GenPathCURD.create(db, topic="bob-section", user_id=bob.id)
        section = GenPathSection.create_many(
            db,
            bob_project["id"],
            [{"title": "bob chapter", "description": "secret"}],
        )[0]
        alice_project = GenPathCURD.create(db, topic="alice-section", user_id=alice.id)
        return bob_project, section, alice_project

    def test_cannot_write_into_another_users_section(self, client, db, users):
        bob_project, bob_section, alice_project = self._seed(db, users)
        alice, bob = users

        # Alice owns alice_project but points the request at Bob's section.
        resp = client.post(
            "/gen-path/tutorial",
            headers={"Authorization": f"Bearer {_token(alice)}"},
            json={
                "project_id": alice_project["id"],
                "section_id": bob_section["id"],
                "resource_urls": [],
            },
        )
        assert resp.status_code == 404, resp.text[:300]

        # Bob's section must be untouched.
        row = db.execute(
            text("SELECT tutorial_md FROM gen_path_sections WHERE id = :id"),
            {"id": bob_section["id"]},
        ).fetchone()
        assert row is not None
        assert not row[0]

    def test_cannot_add_resources_to_another_users_section(self, client, db, users):
        bob_project, bob_section, alice_project = self._seed(db, users)
        alice, bob = users

        resp = client.post(
            "/gen-path/resources",
            headers={"Authorization": f"Bearer {_token(alice)}"},
            json={
                "project_id": alice_project["id"],
                "section_id": bob_section["id"],
            },
        )
        assert resp.status_code == 404, resp.text[:300]

        count = db.execute(
            text(
                "SELECT COUNT(*) FROM gen_path_section_resources r "
                "JOIN gen_path_sections s ON s.id = r.section_id "
                "WHERE s.id = :id"
            ),
            {"id": bob_section["id"]},
        ).scalar()
        assert count == 0


class TestDebugEndpointsDisabled:
    def test_debug_endpoints_return_404_by_default(self, client):
        for url, payload in [
            ("/ai-path/debug/step5_github", {"topic": "x"}),
            ("/ai-path/debug/combined", {"topic": "x"}),
        ]:
            resp = client.post(url, json=payload)
            assert resp.status_code == 404, f"{url} -> {resp.status_code} {resp.text[:200]}"
