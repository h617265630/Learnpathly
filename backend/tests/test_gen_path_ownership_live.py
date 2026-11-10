"""
End-to-end ownership test against a REAL postgres database.

Creates two users and two gen_path projects, then verifies through the actual
SQL (not mocks) that:
  - listing only returns the caller's own projects
  - deleting somebody else's project is impossible
  - the projects table rows are still intact afterwards

Run with DATABASE_URL pointing at a throwaway postgres.
"""
import os
import sys

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import Base, engine
from app.curd.gen_path_curd import GenPathCURD


@pytest.fixture(scope="module", autouse=True)
def _schema():
    # import exactly like app.main does, so the gen_path models are registered
    # on Base.metadata before create_all() runs (same pitfall as the 28e3ab7 fix)
    from app.main import app as _app  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    with Session(engine) as session:
        yield session


@pytest.fixture()
def users(db):
    from app.models.rbac.user import User

    a = User(username="audit_alice", email="alice@audit.local", hashed_password="x")
    b = User(username="audit_bob", email="bob@audit.local", hashed_password="x")
    db.add_all([a, b])
    db.commit()
    db.refresh(a)
    db.refresh(b)
    yield a, b
    db.query(User).filter(User.username.in_(["audit_alice", "audit_bob"])).delete()
    db.commit()


def _mk_project(db, user_id, topic):
    return GenPathCURD.create(db, topic=topic, user_id=user_id)


class TestLiveOwnership:
    def test_list_only_returns_own_projects(self, db, users):
        alice, bob = users
        _mk_project(db, alice.id, "alice-topic-a")
        _mk_project(db, alice.id, "alice-topic-b")
        _mk_project(db, bob.id, "bob-topic")

        alice_projects = GenPathCURD.list_by_user(db, user_id=alice.id)
        topics = sorted(p["topic"] for p in alice_projects)
        assert topics == ["alice-topic-a", "alice-topic-b"]
        assert "bob-topic" not in topics

        bob_projects = GenPathCURD.list_by_user(db, user_id=bob.id)
        assert [p["topic"] for p in bob_projects] == ["bob-topic"]

        assert GenPathCURD.count_by_user(db, user_id=alice.id) == 2
        assert GenPathCURD.count_by_user(db, user_id=bob.id) == 1

    def test_cannot_read_other_users_project(self, db, users):
        alice, bob = users
        bob_project = _mk_project(db, bob.id, "bob-private")

        assert GenPathCURD.get_by_id_for_user(db, bob_project["id"], alice.id) is None
        assert GenPathCURD.get_by_id_for_user(db, bob_project["id"], bob.id) is not None

    def test_cannot_delete_other_users_project(self, db, users):
        alice, bob = users
        bob_project = _mk_project(db, bob.id, "bob-doomed")

        deleted = GenPathCURD.delete(db, bob_project["id"], user_id=alice.id)
        assert deleted is False

        # row must still be there
        row = db.execute(
            text("SELECT id FROM gen_path_projects WHERE id = :id"),
            {"id": bob_project["id"]},
        ).fetchone()
        assert row is not None

        # the owner can delete it
        assert GenPathCURD.delete(db, bob_project["id"], user_id=bob.id) is True
        row = db.execute(
            text("SELECT id FROM gen_path_projects WHERE id = :id"),
            {"id": bob_project["id"]},
        ).fetchone()
        assert row is None

    def test_previous_leak_query_would_have_leaked(self, db, users):
        """Sanity check: the OLD predicate really did return everything."""
        alice, bob = users
        _mk_project(db, alice.id, "alice-old")
        _mk_project(db, bob.id, "bob-old")

        old_rows = db.execute(
            text("""
                SELECT topic FROM gen_path_projects
                WHERE (:user_id IS NULL OR user_id = :user_id)
            """),
            {"user_id": None},
        ).fetchall()
        assert len(old_rows) >= 2  # <- the leak we removed
