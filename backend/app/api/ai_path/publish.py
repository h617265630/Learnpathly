"""Publish an AiPathProject into the public `learning_paths` table.

Background
----------
`AiPathProject` (ai_path_projects) is the "draft workspace" of the AI path
pipeline: project -> sections -> subnodes -> details.  The public site only
reads `learning_paths` (+ `path_items`), and while the *read* side existed
(`GET /ai-path/projects/by-learning-path/{learning_path_id}`) there was **no
write side at all**: `published_learning_path_id` was never assigned anywhere
in the codebase, so an AI-generated path could never reach the formal table.

This module adds that missing write side:

    POST /ai-path/projects/{project_id}/publish

It creates a `LearningPath` (status=published) from the project outline,
optionally attaches `PathItem`s for real rows in `resources`, and links the
two tables together through `ai_path_projects.published_learning_path_id`.

Design notes
------------
* Auth is *optional* (`get_current_user_optional`), matching the rest of the
  ai_path surface (the "ai_path 是否强制登录" question is a product decision
  and is deliberately not changed here).  When a project has an owner, only
  that owner (or a superuser) may publish it.
* Resources are never fabricated: a PathItem is only created for a row that
  already exists in `resources`.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_optional, get_db_dep
from app.models.ai_path_project import AiPathProject
from app.models.ai_path_section import AiPathSection
from app.models.ai_path_subnode import AiPathSubNode
from app.models.category import Category
from app.models.learning_path import LearningPath
from app.models.path_item import PathItem
from app.models.resource import Resource
from app.models.user_learning_path import UserLearningPath


router = APIRouter()

MAX_AUTO_ATTACHED_RESOURCES = 12


class AiPathPublishRequest(BaseModel):
    """Body of `POST /ai-path/projects/{project_id}/publish`."""

    category_id: Optional[int] = Field(
        default=None,
        description="Target category for the learning path. Defaults to the first category in the DB.",
    )
    title: Optional[str] = Field(default=None, description="Override the learning path title.")
    description: Optional[str] = Field(
        default=None, description="Override the learning path description."
    )
    cover_image_url: Optional[str] = Field(default=None, description="Override the cover image.")
    is_public: bool = Field(
        default=False, description="Whether the published path is visible to everybody."
    )
    resource_ids: list[int] = Field(
        default_factory=list,
        description="Explicit resource ids (rows of `resources`) to attach as path items.",
    )
    auto_attach_resources: bool = Field(
        default=True,
        description="Additionally match existing resources against sub-node search keywords.",
    )


class AiPathPublishResponse(BaseModel):
    learning_path_id: int
    project_id: int
    created: bool
    path_item_count: int
    status: str
    message: str


# ─── helpers ────────────────────────────────────────────────────────────────


def _normalise(text: str | None) -> str:
    return str(text or "").strip()


def _build_description(project: AiPathProject, sections: list[AiPathSection]) -> str:
    """Compose a human-readable description for the learning path.

    `learning_paths` has no JSON column, so the outline has to be flattened
    into text.  The structured version stays available through
    `GET /ai-path/projects/by-learning-path/{id}`.
    """
    overview = _normalise(project.outline_overview)
    lines: list[str] = []
    for section in sections:
        title = _normalise(section.title)
        desc = _normalise(section.description)
        minutes = section.estimated_minutes
        suffix = f" (~{minutes} min)" if minutes else ""
        lines.append(f"- {title}{suffix}" + (f": {desc}" if desc else ""))
    body = "\n".join(lines)
    if overview and body:
        return f"{overview}\n\n{body}"
    return overview or body


def _resolve_category(db: Session, category_id: int | None) -> Category:
    if category_id is not None:
        category = db.query(Category).filter(Category.id == category_id).first()
        if category is None:
            raise HTTPException(status_code=400, detail=f"Category {category_id} not found")
        return category

    category = db.query(Category).order_by(Category.id).first()
    if category is None:
        raise HTTPException(
            status_code=400,
            detail="No category available: create a category or pass category_id explicitly",
        )
    return category


def _iter_project_sections(db: Session, project_id: int) -> list[AiPathSection]:
    return (
        db.query(AiPathSection)
        .filter(AiPathSection.project_id == project_id)
        .order_by(AiPathSection.order_index)
        .all()
    )


def _iter_project_subnodes(db: Session, project_id: int) -> list[AiPathSubNode]:
    return (
        db.query(AiPathSubNode)
        .join(AiPathSection, AiPathSection.id == AiPathSubNode.section_id)
        .filter(AiPathSection.project_id == project_id)
        .order_by(AiPathSection.order_index, AiPathSubNode.order_index)
        .all()
    )


def _collect_resources(
    db: Session,
    project_id: int,
    explicit_ids: list[int],
    auto_attach: bool,
) -> list[tuple[Resource, str, str]]:
    """Return [(resource, stage, purpose)] for path items.

    Only rows that already exist in `resources` are used - we never fabricate
    resource rows here.
    """
    picked: list[tuple[Resource, str, str]] = []
    seen: set[int] = set()

    for raw_id in explicit_ids or []:
        try:
            rid = int(raw_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail=f"Invalid resource id: {raw_id!r}")
        resource = db.query(Resource).filter(Resource.id == rid).first()
        if resource is None:
            raise HTTPException(status_code=400, detail=f"Resource {rid} not found")
        if rid in seen:
            continue
        seen.add(rid)
        picked.append((resource, "", ""))

    if auto_attach and len(picked) < MAX_AUTO_ATTACHED_RESOURCES:
        for subnode in _iter_project_subnodes(db, project_id):
            if len(picked) >= MAX_AUTO_ATTACHED_RESOURCES:
                break
            keywords = subnode.search_keywords
            if not isinstance(keywords, list):
                keywords = []
            section = getattr(subnode, "section", None)
            stage = _normalise(getattr(section, "title", "")) if section is not None else ""
            purpose = _normalise(subnode.title)
            for keyword in keywords[:3]:
                if len(picked) >= MAX_AUTO_ATTACHED_RESOURCES:
                    break
                kw = _normalise(keyword)
                if not kw:
                    continue
                resource = (
                    db.query(Resource)
                    .filter(Resource.title.ilike(f"%{kw}%"))
                    .order_by(Resource.community_score.desc())
                    .first()
                )
                if resource is None or resource.id in seen:
                    continue
                seen.add(resource.id)
                picked.append((resource, stage, purpose))

    return picked


# ─── core publish logic (kept separate from the HTTP layer for testability) ──


def publish_project_to_learning_path(
    db: Session,
    project: AiPathProject,
    payload: AiPathPublishRequest,
    current_user: Any | None = None,
) -> AiPathPublishResponse:
    """Create (or return) the `learning_paths` row for an AI path project."""
    # Ownership: a project with an owner may only be published by that owner.
    if project.user_id is not None and current_user is not None:
        if int(project.user_id) != int(current_user.id) and not getattr(
            current_user, "is_superuser", False
        ):
            raise HTTPException(
                status_code=403, detail="You are not allowed to publish this project"
            )

    # Idempotent: already published -> return the existing learning path.
    if project.published_learning_path_id:
        existing = (
            db.query(LearningPath)
            .filter(LearningPath.id == project.published_learning_path_id)
            .first()
        )
        if existing is not None:
            count = (
                db.query(PathItem)
                .filter(PathItem.learning_path_id == existing.id)
                .count()
            )
            return AiPathPublishResponse(
                learning_path_id=existing.id,
                project_id=project.id,
                created=False,
                path_item_count=count,
                status=project.status or "",
                message="Project is already published.",
            )

    sections = _iter_project_sections(db, project.id)
    category = _resolve_category(db, payload.category_id)

    title = _normalise(payload.title) or _normalise(project.topic) or "Untitled path"
    description = (
        _normalise(payload.description)
        or _build_description(project, sections)
        or _normalise(project.topic)
    )
    cover = _normalise(payload.cover_image_url) or _normalise(project.cover_image_url)

    creator_id = project.user_id
    if creator_id is None and current_user is not None:
        creator_id = getattr(current_user, "id", None)

    learning_path = LearningPath(
        title=title[:200],
        type="ai_path",
        description=description,
        is_public=bool(payload.is_public),
        is_active=True,
        cover_image_url=cover or None,
        category_id=category.id,
        creator_id=creator_id,
        status="published",
        published_at=datetime.now(),
    )
    db.add(learning_path)
    db.flush()

    resources = _collect_resources(
        db,
        project.id,
        payload.resource_ids or [],
        bool(payload.auto_attach_resources),
    )
    for index, (resource, stage, purpose) in enumerate(resources):
        db.add(
            PathItem(
                learning_path_id=learning_path.id,
                resource_id=resource.id,
                order_index=index,
                stage=stage or None,
                purpose=purpose or None,
                is_optional=False,
            )
        )

    if creator_id is not None:
        existing_link = (
            db.query(UserLearningPath)
            .filter(
                UserLearningPath.user_id == creator_id,
                UserLearningPath.learning_path_id == learning_path.id,
            )
            .first()
        )
        if existing_link is None:
            db.add(
                UserLearningPath(
                    user_id=creator_id, learning_path_id=learning_path.id
                )
            )

    project.published_learning_path_id = learning_path.id
    project.status = "published"
    db.commit()
    db.refresh(learning_path)

    return AiPathPublishResponse(
        learning_path_id=learning_path.id,
        project_id=project.id,
        created=True,
        path_item_count=len(resources),
        status=project.status,
        message="Project published.",
    )


# ─── HTTP endpoint ──────────────────────────────────────────────────────────


@router.post("/projects/{project_id}/publish", response_model=AiPathPublishResponse)
async def publish_ai_path_project(
    project_id: int,
    payload: AiPathPublishRequest | None = None,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user_optional),
):
    """Publish an AI path project into the formal `learning_paths` table."""
    project = (
        db.query(AiPathProject).filter(AiPathProject.id == project_id).first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    body = payload or AiPathPublishRequest()
    return publish_project_to_learning_path(db, project, body, current_user)
