"""
Integration test for the AI-path publish flow (project -> learning_paths).

Before this change there was no write side at all: `published_learning_path_id`
was never written anywhere in the codebase, so an AI-generated path could never
reach the formal `learning_paths` table.

Run against a REAL postgres (SQLite cannot handle `gen_random_uuid()::text`):

    DATABASE_URL="postgresql://flower@127.0.0.1:55432/lp_auth_test" \
      .venv315/bin/python -m pytest tests/test_ai_path_publish.py -q
"""
import pytest
from uuid import uuid4
from sqlalchemy.orm import Session

from app.db.database import Base, engine


@pytest.fixture(scope="module", autouse=True)
def _schema():
    # import app.main so every model is registered on Base.metadata
    from app.main import app as _app  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    with Session(engine) as session:
        yield session
        session.rollback()


@pytest.fixture()
def category(db):
    from app.models.category import Category

    # names are unique -> make them unique per test
    suffix = uuid4().hex[:8]
    cat = Category(name=f"publish_test_cat_{suffix}", code=f"publish_test_cat_{suffix}")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    # no teardown delete: published learning_paths reference the category
    # (the whole schema is dropped at the end of the module anyway)
    return cat


@pytest.fixture()
def resource(db, category):
    from app.models.resource import Resource

    res = Resource(
        resource_type="article",
        platform="web",
        title="Python 异步编程完全指南",
        summary="asyncio 入门",
        source_url="https://example.com/async-python",
        category_id=category.id,
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res


def _make_project(db, topic="从零到一的机器学习路线"):
    from app.models.ai_path_project import AiPathProject
    from app.models.ai_path_section import AiPathSection
    from app.models.ai_path_subnode import AiPathSubNode

    project = AiPathProject(
        topic=topic,
        level="beginner",
        learning_depth="standard",
        content_type="mixed",
        practical_ratio="balanced",
        resource_count="standard",
        status="outline_generated",
        outline_overview="一条从零开始的机器学习学习路径。",
    )
    db.add(project)
    db.flush()

    section = AiPathSection(
        project_id=project.id,
        order_index=0,
        title="第一章：基础概念",
        description="理解核心术语",
        estimated_minutes=30,
    )
    db.add(section)
    db.flush()

    subnode = AiPathSubNode(
        section_id=section.id,
        order_index=0,
        title="什么是异步",
        description="理解 asyncio",
        key_points=["event loop", "await"],
        search_keywords=["Python 异步编程完全指南", "不存在的关键词zzz"],
    )
    db.add(subnode)
    db.commit()
    db.refresh(project)
    return project


class TestPublish:
    def test_publish_creates_learning_path_and_links_project(self, db, category, resource):
        from app.api.ai_path.publish import AiPathPublishRequest, publish_project_to_learning_path
        from app.models.learning_path import LearningPath
        from app.models.path_item import PathItem

        project = _make_project(db)
        resp = publish_project_to_learning_path(
            db, project, AiPathPublishRequest(category_id=category.id)
        )

        assert resp.created is True
        assert resp.path_item_count >= 1

        lp = db.query(LearningPath).filter(LearningPath.id == resp.learning_path_id).one()
        assert lp.title == project.topic
        assert lp.status == "published"
        assert lp.category_id == category.id
        assert lp.type == "ai_path"
        # description keeps the outline overview
        assert "机器学习" in (lp.description or "")

        # project <-> learning path link
        db.refresh(project)
        assert project.published_learning_path_id == lp.id
        assert project.status == "published"

        # resource matched through the sub-node keyword became a path item
        items = db.query(PathItem).filter(PathItem.learning_path_id == lp.id).all()
        assert any(item.resource_id == resource.id for item in items)
        # order_index must be unique inside one path
        assert len({item.order_index for item in items}) == len(items)

    def test_publish_is_idempotent(self, db, category):
        from app.api.ai_path.publish import AiPathPublishRequest, publish_project_to_learning_path
        from app.models.learning_path import LearningPath

        project = _make_project(db, topic="幂等性测试路径")
        first = publish_project_to_learning_path(
            db, project, AiPathPublishRequest(category_id=category.id)
        )
        second = publish_project_to_learning_path(
            db, project, AiPathPublishRequest(category_id=category.id)
        )

        assert first.created is True
        assert second.created is False
        assert first.learning_path_id == second.learning_path_id
        assert (
            db.query(LearningPath).filter(LearningPath.id == first.learning_path_id).count()
            == 1
        )

    def test_unknown_resource_id_is_rejected(self, db, category):
        from fastapi import HTTPException

        from app.api.ai_path.publish import AiPathPublishRequest, publish_project_to_learning_path

        project = _make_project(db, topic="错误资源测试路径")
        with pytest.raises(HTTPException) as exc:
            publish_project_to_learning_path(
                db, project, AiPathPublishRequest(category_id=category.id, resource_ids=[999999])
            )
        assert exc.value.status_code == 400

    def test_unknown_category_is_rejected(self, db):
        from fastapi import HTTPException

        from app.api.ai_path.publish import AiPathPublishRequest, publish_project_to_learning_path

        project = _make_project(db, topic="错误分类测试路径")
        with pytest.raises(HTTPException) as exc:
            publish_project_to_learning_path(
                db, project, AiPathPublishRequest(category_id=999999)
            )
        assert exc.value.status_code == 400

    def test_other_user_cannot_publish_owned_project(self, db, category):
        from fastapi import HTTPException

        from app.api.ai_path.publish import AiPathPublishRequest, publish_project_to_learning_path
        from app.models.rbac.user import User

        owner = User(username="pub_owner", email="owner@pub.local", hashed_password="x")
        other = User(username="pub_other", email="other@pub.local", hashed_password="x")
        db.add_all([owner, other])
        db.commit()
        db.refresh(owner)
        db.refresh(other)

        project = _make_project(db, topic="越权发布测试路径")
        project.user_id = owner.id
        db.commit()

        with pytest.raises(HTTPException) as exc:
            publish_project_to_learning_path(
                db,
                project,
                AiPathPublishRequest(category_id=category.id),
                current_user=other,
            )
        assert exc.value.status_code == 403

    def test_endpoint_is_registered(self):
        from app.main import app

        paths = app.openapi()["paths"]
        assert "/ai-path/projects/{project_id}/publish" in paths
        assert "post" in paths["/ai-path/projects/{project_id}/publish"]
