"""
Tests for the gen_path ownership isolation and the ai_path debug-endpoint guard.

Background
----------
Before this change `GenPathCURD.list_by_user` / `count_by_user` filtered with
`(:user_id IS NULL OR user_id = :user_id)`. A NULL user_id makes that predicate
always true, so *every* caller received every user's projects. The delete
endpoint also had no ownership check at all.

These tests lock the fixed behaviour down so the leak cannot come back.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.curd.gen_path_curd import GenPathCURD


# ─── gen_path: list / count are scoped to one user ──────────────────────────

class TestGenPathListingIsUserScoped:
    def test_list_by_user_filters_by_user_id(self):
        db = MagicMock()
        db.execute.return_value.fetchall.return_value = []

        GenPathCURD.list_by_user(db, user_id=7, limit=20, offset=0)

        sql = db.execute.call_args[0][0]
        params = db.execute.call_args[0][1]
        assert "user_id = :user_id" in str(sql)
        # the "IS NULL OR" trick must not be back
        assert "IS NULL OR" not in str(sql)
        assert params["user_id"] == 7

    def test_count_by_user_filters_by_user_id(self):
        db = MagicMock()
        db.execute.return_value.scalar.return_value = 3

        assert GenPathCURD.count_by_user(db, user_id=7) == 3

        sql = db.execute.call_args[0][0]
        assert "IS NULL OR" not in str(sql)
        assert db.execute.call_args[0][1]["user_id"] == 7

    def test_user_id_is_a_required_argument(self):
        """Passing no user_id must be a TypeError, not a silent 'all users'."""
        with pytest.raises(TypeError):
            GenPathCURD.list_by_user(MagicMock())  # type: ignore[call-arg]
        with pytest.raises(TypeError):
            GenPathCURD.count_by_user(MagicMock())  # type: ignore[call-arg]


# ─── gen_path: get / delete enforce ownership ───────────────────────────────

class TestGenPathOwnership:
    def test_get_by_id_for_user_scopes_to_owner(self):
        db = MagicMock()
        db.execute.return_value.fetchone.return_value = None

        result = GenPathCURD.get_by_id_for_user(db, "proj-1", user_id=7)

        assert result is None
        sql = db.execute.call_args[0][0]
        params = db.execute.call_args[0][1]
        assert "user_id = :user_id" in str(sql)
        assert params == {"id": "proj-1", "user_id": 7}

    def test_delete_only_removes_own_row(self):
        db = MagicMock()
        result = MagicMock()
        result.rowcount = 0
        db.execute.return_value = result

        deleted = GenPathCURD.delete(db, "proj-1", user_id=7)

        assert deleted is False
        sql = db.execute.call_args[0][0]
        params = db.execute.call_args[0][1]
        assert "user_id = :user_id" in str(sql)
        assert params == {"id": "proj-1", "user_id": 7}

    def test_delete_reports_success_when_own_row_removed(self):
        db = MagicMock()
        result = MagicMock()
        result.rowcount = 1
        db.execute.return_value = result

        assert GenPathCURD.delete(db, "proj-1", user_id=7) is True


# ─── router: cross-user access is a 404, not a leak ─────────────────────────

class TestGenPathRouterOwnership:
    def _user(self, user_id=7):
        user = MagicMock()
        user.id = user_id
        return user

    def test_get_project_hides_other_users_project(self):
        from app.api.gen_path import router as gen_path_router

        db = MagicMock()
        with patch.object(
            GenPathCURD, "get_by_id_for_user", return_value=None
        ):
            with pytest.raises(HTTPException) as exc:
                gen_path_router._get_owned_project(db, "proj-1", self._user())

        assert exc.value.status_code == 404

    def test_get_owned_project_returns_project_for_owner(self):
        from app.api.gen_path import router as gen_path_router

        db = MagicMock()
        project = {"id": "proj-1", "user_id": 7}
        with patch.object(
            GenPathCURD, "get_by_id_for_user", return_value=project
        ):
            got = gen_path_router._get_owned_project(db, "proj-1", self._user())

        assert got == project


# ─── ai_path: debug endpoints are off by default ────────────────────────────

class TestDebugEndpointGuard:
    def test_debug_endpoints_disabled_by_default(self):
        from app.api.ai_path.router import require_debug_endpoints
        from app.core.config import settings

        settings.ENABLE_DEBUG_ENDPOINTS = False
        with pytest.raises(HTTPException) as exc:
            require_debug_endpoints()
        assert exc.value.status_code == 404

    def test_debug_endpoints_enabled_when_flag_on(self):
        from app.api.ai_path.router import require_debug_endpoints
        from app.core.config import settings

        settings.ENABLE_DEBUG_ENDPOINTS = True
        try:
            assert require_debug_endpoints() is None
        finally:
            settings.ENABLE_DEBUG_ENDPOINTS = False

    def test_every_debug_endpoint_carries_the_guard(self):
        """No /ai-path/debug/* route may exist without the guard dependency."""
        from app.api.ai_path.router import router as ai_path_router

        debug_routes = [
            r for r in ai_path_router.routes
            if getattr(r, "path", "").startswith("/ai-path/debug")
        ]
        assert debug_routes, "expected debug endpoints to exist"

        for route in debug_routes:
            deps = {d.call for d in getattr(route, "dependant", None).dependencies} if getattr(route, "dependant", None) else set()
            names = {getattr(d, "__name__", "") for d in deps}
            assert "require_debug_endpoints" in names, (
                f"{route.path} is missing the debug guard"
            )
