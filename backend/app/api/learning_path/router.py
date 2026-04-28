from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_db_dep, get_current_user
from app.api.learning_path.schemas import (
    LearningPathCreate,
    LearningPathUpdate,
    LearningPathResponse,
    LearningPathDetailResponse,
    PathItemInLearningPathResponse,
    AddResourceToLearningPathRequest,
    ResourceKind,
    LearningPathAttachResponse,
    LearningPathUserStatusResponse,
)
from app.curd.learning_path_curd import LearningPathCURD
from app.curd.path_item_curd import PathItemCURD
from app.models.user_learning_path import UserLearningPath
from app.models.learning_path import LearningPath
from app.models.path_item import PathItem
from app.models.resource import Resource
from app.models.learning_path_resource_summary import LearningPathResourceSummary
from app.schemas.resources.resource import ResourceResponse


router = APIRouter(prefix="/learning-paths", tags=["learning-paths"])

class LearningPathResourceSummariesRequest(BaseModel):
    limit: int = 4
    force_refresh: bool = False


class LearningPathResourceRegenerateRequest(BaseModel):
    limit: int = 12
    resource_ids: list[int] = []
    update_resource_summary: bool = False


class LearningPathCoverImageRequest(BaseModel):
    force_refresh: bool = False
    query: str | None = None


class LearningPathCoverImageResponse(BaseModel):
    learning_path_id: int
    title: str
    cover_image_url: str
    source: str
    saved: bool
    warnings: list[str] = []


class LearningPathResourceSummaryItem(BaseModel):
    path_item_id: int | None = None
    resource_id: int
    url: str
    title: str
    summary: str
    key_points: list[str] = []
    resource_type: str = ""
    platform: str = ""
    thumbnail: str | None = None
    learning_stage: str | None = None
    estimated_minutes: int | None = None


class LearningPathResourceSummariesResponse(BaseModel):
    learning_path_id: int
    topic: str
    items: list[LearningPathResourceSummaryItem]


class LearningPathResourceRegenerateResponse(LearningPathResourceSummariesResponse):
    regenerated_count: int


def _looks_english_text(text: str) -> bool:
    import re as _re
    s = (text or "").strip()
    if not s:
        return False
    if _re.search(r"[\u4e00-\u9fff]", s):
        return False
    return bool(_re.search(r"[A-Za-z]", s))


def _looks_like_cover_url(url: str) -> bool:
    value = str(url or "").strip()
    if not value.startswith(("http://", "https://")):
        return False
    if value.lower().endswith(".svg"):
        return False
    return True


def _first_resource_cover_candidate(lp: LearningPath) -> str:
    path_items = sorted(
        list(getattr(lp, "path_items", []) or []),
        key=lambda item: getattr(item, "order_index", 0) or 0,
    )
    for item in path_items:
        resource = getattr(item, "resource", None)
        if resource is None:
            continue
        thumbnail = str(getattr(resource, "thumbnail", "") or "").strip()
        if _looks_like_cover_url(thumbnail):
            return thumbnail
    return ""


async def _find_learning_path_cover_image(lp: LearningPath, query: str) -> tuple[str, str, list[str]]:
    warnings: list[str] = []

    try:
        from app.api.ai_path.service import generate_topic_card_image

        cover_url, cover_warnings = await generate_topic_card_image(query)
        warnings.extend(cover_warnings)
        if _looks_like_cover_url(cover_url):
            source = "topic_search"
            if "placehold.co" in cover_url:
                resource_cover = _first_resource_cover_candidate(lp)
                if resource_cover:
                    return resource_cover, "resource_thumbnail", warnings
                source = "topic_placeholder"
            return cover_url, source, warnings
    except Exception as exc:
        warnings.append(f"Topic cover search failed: {exc}")

    resource_cover = _first_resource_cover_candidate(lp)
    if resource_cover:
        return resource_cover, "resource_thumbnail", warnings

    return "", "none", warnings


def _is_specific_resource_summary(summary: str, key_points: list[str]) -> bool:
    text = (summary or "").strip()
    lowered = text.lower()
    generic_phrases = [
        "use this resource",
        "learn about",
        "related to this topic",
        "no summary available",
        "helps learners understand the topic",
        "can help learners understand",
    ]
    if len(text) < 220:
        return False
    if len([p for p in key_points if str(p).strip()]) < 3:
        return False
    return not any(phrase in lowered for phrase in generic_phrases)


def _fallback_specific_resource_summary(
    *,
    topic: str,
    title: str,
    summary: str,
    resource_type: str,
    platform: str,
    learning_stage: str,
    purpose: str,
) -> tuple[str, list[str]]:
    stage_text = f" in the {learning_stage} stage" if learning_stage else ""
    platform_text = f" from {platform}" if platform else ""
    purpose_text = f" It is included because {purpose.strip()}" if purpose else ""
    out = (
        f"{title} is a {resource_type or 'resource'}{platform_text} for studying {topic}{stage_text}. "
        f"It gives learners a concrete reference to connect the path topic with real material, examples, or implementation details. "
        f"{purpose_text}".strip()
    )
    points = [
        f"Use it while studying {learning_stage or 'this stage'}",
        "Extract concrete concepts, examples, and workflow details",
        "Compare its approach with the learning path outline",
    ]
    return out, points


async def _summarize_resource_for_topic(
    *,
    topic: str,
    title: str,
    summary: str,
    url: str,
    resource_type: str,
    platform: str,
    learning_stage: str,
    purpose: str,
) -> tuple[str, list[str]]:
    """
    Step4-like: produce a specific, learn-focused summary + key points for one resource.
    Uses existing resource metadata as input to keep latency low.
    """
    from ai_path.utils.llm import get_llm
    from langchain_core.output_parsers import JsonOutputParser
    from langchain_core.prompts import ChatPromptTemplate

    wants_english = _looks_english_text(topic) or _looks_english_text(title)
    language_hint = "English" if wants_english else "Chinese"

    prompt = ChatPromptTemplate.from_template(
        """You are an expert educator writing resource guidance for a learning path page.

Write a concrete introduction for this resource. Do not write generic marketing text.
Explain exactly how the learner should use this resource inside the path.

Topic: {topic}
Resource title: {title}
Resource URL: {url}
Resource type: {resource_type}
Platform: {platform}
Learning stage: {learning_stage}
Why this resource is in the path: {purpose}
Existing description/summary:
{summary}

Output language: {language_hint}

Return JSON (no markdown fences):
{{
  "summary": "4-6 specific sentences. Mention what the resource covers, why it matters for this topic, how to study it, and what concrete outcome the learner should produce after using it.",
  "key_points": ["4-6 specific takeaways or actions, each 8-18 words"]
}}"""
    )

    chain = prompt | get_llm(temperature=0.25) | JsonOutputParser()
    result = await chain.ainvoke(
        {
            "topic": topic,
            "title": title,
            "summary": summary[:1200],
            "url": url,
            "resource_type": resource_type,
            "platform": platform or "web",
            "learning_stage": learning_stage or "core learning",
            "purpose": purpose or "to support this learning path with concrete reference material",
            "language_hint": language_hint,
        }
    )
    out_summary = str((result or {}).get("summary") or "").strip()
    out_points = (result or {}).get("key_points") or []
    points = [str(p).strip() for p in out_points if str(p).strip()]
    return out_summary, points[:6]


def _resource_type_value(obj: Resource) -> str:
    rt = getattr(obj, "resource_type", None)
    val = rt.value if hasattr(rt, "value") else (str(rt) if rt is not None else "")
    return (val or "").strip().lower() or "unknown"


def _to_resource_response(obj: Resource) -> ResourceResponse:
    return ResourceResponse(
        id=obj.id,
        resource_type=_resource_type_value(obj),
        platform=getattr(obj, "platform", None),
        title=obj.title,
        summary=getattr(obj, "summary", None),
        source_url=getattr(obj, "source_url", None),
        thumbnail=getattr(obj, "thumbnail", None),
        category_id=getattr(obj, "category_id", None),
        category_name=getattr(obj, "category_name", None),
        difficulty=getattr(obj, "difficulty", None),
        tags=getattr(obj, "tags", None),
        raw_meta=getattr(obj, "raw_meta", None),
        created_at=getattr(obj, "created_at", None),
    )


def _summary_item_from_record(record: LearningPathResourceSummary) -> LearningPathResourceSummaryItem:
    key_points = record.key_points if isinstance(record.key_points, list) else []
    return LearningPathResourceSummaryItem(
        path_item_id=record.path_item_id,
        resource_id=record.resource_id,
        url=record.url,
        title=str(record.title or record.url),
        summary=str(record.summary or ""),
        key_points=[str(x).strip() for x in key_points if str(x).strip()][:6],
        resource_type=str(record.resource_type or ""),
        platform=str(record.platform or ""),
        thumbnail=(str(record.image or "").strip() or None),
        learning_stage=(str(record.learning_stage or "").strip() or None),
        estimated_minutes=record.estimated_minutes,
    )


def _upsert_learning_path_resource_summary(
    db: Session,
    *,
    learning_path_id: int,
    path_item_id: int,
    resource_id: int,
    topic: str,
    title: str,
    url: str,
    summary: str,
    key_points: list[str],
    resource_type: str,
    platform: str,
    learning_stage: str,
    estimated_minutes: int | None,
    image: str | None,
) -> LearningPathResourceSummary:
    record = (
        db.query(LearningPathResourceSummary)
        .filter(
            LearningPathResourceSummary.learning_path_id == learning_path_id,
            LearningPathResourceSummary.path_item_id == path_item_id,
            LearningPathResourceSummary.resource_id == resource_id,
        )
        .first()
    )
    if record is None:
        record = LearningPathResourceSummary(
            learning_path_id=learning_path_id,
            path_item_id=path_item_id,
            resource_id=resource_id,
        )
        db.add(record)

    record.topic = topic
    record.title = title
    record.url = url
    record.summary = summary
    record.key_points = [str(x).strip() for x in key_points if str(x).strip()][:6]
    record.resource_type = resource_type
    record.platform = platform
    record.learning_stage = learning_stage or None
    record.estimated_minutes = estimated_minutes
    record.image = image
    record.generated_by = "learning_path_resource_regenerate"
    return record


async def _generate_and_store_learning_path_resource_summary(
    db: Session,
    *,
    learning_path_id: int,
    topic: str,
    path_item: PathItem,
    resource: Resource,
    update_resource_summary: bool = False,
) -> LearningPathResourceSummaryItem:
    from app.curd.resource_summary_cache_curd import ResourceSummaryCacheCURD

    url = str(getattr(resource, "source_url", "") or "").strip()
    title = str(getattr(resource, "title", "") or url)
    base_summary = str(getattr(resource, "summary", "") or "").strip() or title
    resource_type = _resource_type_value(resource)
    platform = str(getattr(resource, "platform", "") or "")
    learning_stage = str(getattr(path_item, "stage", None) or "")
    purpose = str(getattr(path_item, "purpose", None) or "")
    estimated_minutes = int(getattr(path_item, "estimated_time", 0) or 0) or None
    image = str(getattr(resource, "thumbnail", "") or "").strip() or None

    try:
        ai_summary, key_points = await _summarize_resource_for_topic(
            topic=topic,
            title=title,
            summary=base_summary,
            url=url,
            resource_type=resource_type,
            platform=platform,
            learning_stage=learning_stage,
            purpose=purpose,
        )
    except Exception:
        ai_summary, key_points = _fallback_specific_resource_summary(
            topic=topic,
            title=title,
            summary=base_summary,
            resource_type=resource_type,
            platform=platform,
            learning_stage=learning_stage,
            purpose=purpose,
        )

    summary = ai_summary or base_summary
    record = _upsert_learning_path_resource_summary(
        db,
        learning_path_id=learning_path_id,
        path_item_id=path_item.id,
        resource_id=resource.id,
        topic=topic,
        title=title,
        url=url,
        summary=summary,
        key_points=key_points,
        resource_type=resource_type,
        platform=platform,
        learning_stage=learning_stage,
        estimated_minutes=estimated_minutes,
        image=image,
    )

    ResourceSummaryCacheCURD.upsert(
        db,
        url=url,
        topic=topic,
        title=title,
        summary=summary,
        key_points=key_points,
        difficulty=str(getattr(resource, "difficulty", None) or "") or None,
        resource_type=resource_type,
        learning_stage=learning_stage or None,
        estimated_minutes=estimated_minutes,
        image=image,
    )

    if update_resource_summary:
        resource.summary = summary
        db.add(resource)

    db.flush()
    return _summary_item_from_record(record)


def _to_resource_kind(obj: Resource | None) -> ResourceKind:
    if obj is None:
        return ResourceKind.article
    val = _resource_type_value(obj)
    try:
        return ResourceKind(val)
    except Exception:
        return ResourceKind.article


@router.post(
    "/", response_model=LearningPathResponse, status_code=status.HTTP_201_CREATED
)
def create_learning_path(
    payload: LearningPathCreate,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    try:
        lp = LearningPathCURD.create_learning_path(
            db=db,
            user_id=current_user.id,
            title=payload.title,
            type=getattr(payload, "type", None),
            description=payload.description,
            is_public=payload.is_public,
            cover_image_url=getattr(payload, "cover_image_url", None),
            category_id=payload.category_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return lp


@router.get("/public", response_model=List[LearningPathResponse])
def list_public_learning_paths(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db_dep),
):
    return LearningPathCURD.list_public_learning_paths(db, skip=skip, limit=limit)


@router.get("/public/{learning_path_id}", response_model=LearningPathDetailResponse)
def get_public_learning_path_detail(
    learning_path_id: int,
    db: Session = Depends(get_db_dep),
):
    lp = LearningPathCURD.get_learning_path_with_items(db, learning_path_id)
    if (
        not lp
        or (not bool(getattr(lp, "is_public", False)))
        or (not bool(getattr(lp, "is_active", True)))
        or getattr(lp, "status", None) != "published"
    ):
        raise HTTPException(status_code=404, detail="LearningPath not found")

    items: List[PathItemInLearningPathResponse] = []
    for it in lp.path_items:
        res = getattr(it, "resource", None)
        resource_data = _to_resource_response(res) if res is not None else None
        items.append(
            PathItemInLearningPathResponse(
                id=it.id,
                learning_path_id=it.learning_path_id,
                resource_id=it.resource_id,
                resource_type=_to_resource_kind(res),
                title=(getattr(res, "title", "") if res is not None else ""),
                order_index=it.order_index,
                stage=getattr(it, "stage", None),
                purpose=getattr(it, "purpose", None),
                estimated_time=getattr(it, "estimated_time", None),
                is_optional=bool(getattr(it, "is_optional", False)),
                manual_weight=getattr(it, "manual_weight", None),
                resource_data=resource_data,
            )
        )

    return LearningPathDetailResponse(
        id=lp.id,
        title=lp.title,
        type=getattr(lp, "type", None),
        description=lp.description,
        is_public=lp.is_public,
        cover_image_url=getattr(lp, "cover_image_url", None),
        category_id=getattr(lp, "category_id", None),
        category_name=getattr(lp, "category_name", None),
        is_active=lp.is_active,
        path_items=items,
    )


@router.post(
    "/public/{learning_path_id}/cover-image",
    response_model=LearningPathCoverImageResponse,
)
async def generate_public_learning_path_cover_image(
    learning_path_id: int,
    payload: LearningPathCoverImageRequest,
    db: Session = Depends(get_db_dep),
):
    """
    Find a topic-related display image URL for a published learning path and
    persist it to learning_paths.cover_image_url.
    """
    lp = LearningPathCURD.get_learning_path_with_items(db, learning_path_id)
    if (
        not lp
        or (not bool(getattr(lp, "is_public", False)))
        or (not bool(getattr(lp, "is_active", True)))
        or getattr(lp, "status", None) != "published"
    ):
        raise HTTPException(status_code=404, detail="LearningPath not found")

    existing = str(getattr(lp, "cover_image_url", "") or "").strip()
    if existing and not payload.force_refresh:
        return LearningPathCoverImageResponse(
            learning_path_id=lp.id,
            title=lp.title,
            cover_image_url=existing,
            source="database",
            saved=False,
            warnings=[],
        )

    warnings: list[str] = []

    try:
        from app.models.ai_path_project import AiPathProject

        linked_project = (
            db.query(AiPathProject)
            .filter(AiPathProject.published_learning_path_id == learning_path_id)
            .order_by(AiPathProject.created_at.desc(), AiPathProject.id.desc())
            .first()
        )
        linked_cover = str(getattr(linked_project, "cover_image_url", "") or "").strip()
        if _looks_like_cover_url(linked_cover) and not payload.force_refresh:
            lp.cover_image_url = linked_cover
            db.add(lp)
            db.commit()
            db.refresh(lp)
            return LearningPathCoverImageResponse(
                learning_path_id=lp.id,
                title=lp.title,
                cover_image_url=linked_cover,
                source="ai_path_project",
                saved=True,
                warnings=[],
            )
    except Exception as exc:
        warnings.append(f"Linked AI project cover lookup skipped: {exc}")

    query = str(payload.query or "").strip() or str(getattr(lp, "title", "") or "").strip()
    if not query:
        query = f"learning path {learning_path_id}"

    cover_url, source, cover_warnings = await _find_learning_path_cover_image(lp, query)
    warnings.extend(cover_warnings)
    if not cover_url:
        raise HTTPException(status_code=404, detail="No cover image candidate found")

    lp.cover_image_url = cover_url
    db.add(lp)
    db.commit()
    db.refresh(lp)

    return LearningPathCoverImageResponse(
        learning_path_id=lp.id,
        title=lp.title,
        cover_image_url=cover_url,
        source=source,
        saved=True,
        warnings=warnings,
    )


@router.post(
    "/public/{learning_path_id}/ai-resource-summaries",
    response_model=LearningPathResourceSummariesResponse,
)
async def get_public_learning_path_resource_summaries(
    learning_path_id: int,
    payload: LearningPathResourceSummariesRequest,
    db: Session = Depends(get_db_dep),
):
    """
    Generate per-resource AI summaries for the learning path page "test" section.
    Caches results into resource_summary_cache keyed by (url, topic).
    """
    lp = LearningPathCURD.get_learning_path_with_items(db, learning_path_id)
    if (
        not lp
        or (not bool(getattr(lp, "is_public", False)))
        or (not bool(getattr(lp, "is_active", True)))
        or getattr(lp, "status", None) != "published"
    ):
        raise HTTPException(status_code=404, detail="LearningPath not found")

    topic = str(getattr(lp, "title", "") or "").strip() or f"learning_path_{learning_path_id}"
    limit = max(1, min(int(getattr(payload, "limit", 4) or 4), 12))
    force = bool(getattr(payload, "force_refresh", False))

    from app.curd.resource_summary_cache_curd import ResourceSummaryCacheCURD
    import json as _json

    items: list[LearningPathResourceSummaryItem] = []
    path_items = sorted(list(getattr(lp, "path_items", []) or []), key=lambda it: getattr(it, "order_index", 0))
    for it in path_items[:limit]:
        res = getattr(it, "resource", None)
        if res is None:
            continue
        url = str(getattr(res, "source_url", "") or "").strip()
        if not url:
            continue

        linked = None
        if not force:
            linked = (
                db.query(LearningPathResourceSummary)
                .filter(
                    LearningPathResourceSummary.learning_path_id == learning_path_id,
                    LearningPathResourceSummary.path_item_id == it.id,
                    LearningPathResourceSummary.resource_id == res.id,
                )
                .first()
            )
        if linked and (linked.summary or "").strip():
            items.append(_summary_item_from_record(linked))
            continue

        cached = None if force else ResourceSummaryCacheCURD.get(db, url=url, topic=topic)
        if cached and (cached.summary or "").strip():
            kps: list[str] = []
            try:
                kps = _json.loads(cached.key_points or "[]")
                if not isinstance(kps, list):
                    kps = []
            except Exception:
                kps = []
            cached_points = [str(x).strip() for x in kps if str(x).strip()][:6]
            if _is_specific_resource_summary(str(cached.summary or ""), cached_points):
                record = _upsert_learning_path_resource_summary(
                    db,
                    learning_path_id=learning_path_id,
                    path_item_id=it.id,
                    resource_id=res.id,
                    topic=topic,
                    title=str(cached.title or res.title or url),
                    url=url,
                    summary=str(cached.summary or ""),
                    key_points=cached_points,
                    resource_type=_resource_type_value(res),
                    platform=str(getattr(res, "platform", "") or ""),
                    learning_stage=str(getattr(cached, "learning_stage", "") or getattr(it, "stage", "") or ""),
                    estimated_minutes=getattr(cached, "estimated_minutes", None) or getattr(it, "estimated_time", None),
                    image=(str(getattr(res, "thumbnail", "") or getattr(cached, "image", "") or "").strip() or None),
                )
                db.commit()
                items.append(_summary_item_from_record(record))
                continue

        item = await _generate_and_store_learning_path_resource_summary(
            db,
            learning_path_id=learning_path_id,
            topic=topic,
            path_item=it,
            resource=res,
            update_resource_summary=False,
        )
        db.commit()
        items.append(item)

    return LearningPathResourceSummariesResponse(
        learning_path_id=learning_path_id,
        topic=topic,
        items=items,
    )


@router.post(
    "/public/{learning_path_id}/resource-summaries/regenerate",
    response_model=LearningPathResourceRegenerateResponse,
)
async def regenerate_public_learning_path_resource_summaries(
    learning_path_id: int,
    payload: LearningPathResourceRegenerateRequest,
    db: Session = Depends(get_db_dep),
):
    """
    Regenerate resource introductions for a public learning path and persist them
    with explicit learning_path/path_item/resource associations.
    """
    lp = LearningPathCURD.get_learning_path_with_items(db, learning_path_id)
    if (
        not lp
        or (not bool(getattr(lp, "is_public", False)))
        or (not bool(getattr(lp, "is_active", True)))
        or getattr(lp, "status", None) != "published"
    ):
        raise HTTPException(status_code=404, detail="LearningPath not found")

    topic = str(getattr(lp, "title", "") or "").strip() or f"learning_path_{learning_path_id}"
    limit = max(1, min(int(getattr(payload, "limit", 12) or 12), 30))
    allowed_resource_ids = {int(x) for x in (payload.resource_ids or []) if int(x) > 0}

    path_items = sorted(list(getattr(lp, "path_items", []) or []), key=lambda it: getattr(it, "order_index", 0))
    if allowed_resource_ids:
        path_items = [it for it in path_items if int(getattr(it, "resource_id", 0) or 0) in allowed_resource_ids]
    path_items = path_items[:limit]

    items: list[LearningPathResourceSummaryItem] = []
    for it in path_items:
        res = getattr(it, "resource", None)
        if res is None:
            continue
        url = str(getattr(res, "source_url", "") or "").strip()
        if not url:
            continue
        item = await _generate_and_store_learning_path_resource_summary(
            db,
            learning_path_id=learning_path_id,
            topic=topic,
            path_item=it,
            resource=res,
            update_resource_summary=bool(payload.update_resource_summary),
        )
        items.append(item)

    db.commit()
    return LearningPathResourceRegenerateResponse(
        learning_path_id=learning_path_id,
        topic=topic,
        regenerated_count=len(items),
        items=items,
    )


@router.get("/", response_model=List[LearningPathResponse])
def list_learning_paths(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    return LearningPathCURD.get_learning_paths_by_user(
        db, current_user.id, skip=skip, limit=limit
    )


@router.post("/me/{learning_path_id}/attach", response_model=LearningPathAttachResponse)
def attach_public_learning_path_to_me(
    learning_path_id: int,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    # Only allow attaching public + active + published learning paths.
    lp = db.query(LearningPath).filter(LearningPath.id == learning_path_id).first()
    if (
        not lp
        or (not bool(getattr(lp, "is_public", False)))
        or (not bool(getattr(lp, "is_active", True)))
        or getattr(lp, "status", None) != "published"
    ):
        raise HTTPException(status_code=404, detail="LearningPath not found")

    already_exists = (
        db.query(UserLearningPath)
        .filter(
            UserLearningPath.user_id == current_user.id,
            UserLearningPath.learning_path_id == learning_path_id,
        )
        .first()
        is not None
    )

    if already_exists:
        raise HTTPException(
            status_code=409, detail="This path is already in your collection"
        )

    try:
        db.add(
            UserLearningPath(user_id=current_user.id, learning_path_id=learning_path_id)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"添加失败: {e}")

    return LearningPathAttachResponse(
        already_exists=False,
        learning_path=LearningPathResponse.model_validate(lp),
    )


@router.delete("/me/{learning_path_id}")
def detach_learning_path_from_me(
    learning_path_id: int,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    """Remove a learning path from the current user's collection (detach)."""
    assoc = (
        db.query(UserLearningPath)
        .filter(
            UserLearningPath.user_id == current_user.id,
            UserLearningPath.learning_path_id == learning_path_id,
        )
        .first()
    )
    if not assoc:
        raise HTTPException(
            status_code=404, detail="Learning path not found in your collection"
        )
    try:
        db.delete(assoc)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Detach failed: {e}")
    return {"success": True}


@router.get(
    "/me/{learning_path_id}/status",
    response_model=LearningPathUserStatusResponse,
)
def get_learning_path_user_status(
    learning_path_id: int,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    """Check if a path is saved (attached) or forked by the current user."""
    return LearningPathCURD.get_user_path_status(
        db, learning_path_id, current_user.id
    )


def _ensure_ownership(db: Session, user_id: int, learning_path_id: int) -> LearningPath:
    lp = db.query(LearningPath).filter(LearningPath.id == learning_path_id).first()
    if not lp:
        raise HTTPException(status_code=404, detail="LearningPath not found")
    assoc = (
        db.query(UserLearningPath)
        .filter(
            UserLearningPath.user_id == user_id,
            UserLearningPath.learning_path_id == learning_path_id,
        )
        .first()
    )
    if not assoc:
        raise HTTPException(
            status_code=403, detail="No permission for this learning path"
        )
    return lp


@router.get("/{learning_path_id}", response_model=LearningPathDetailResponse)
def get_learning_path_detail(
    learning_path_id: int,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    _ensure_ownership(db, current_user.id, learning_path_id)
    lp = LearningPathCURD.get_learning_path_with_items(db, learning_path_id)
    if not lp:
        raise HTTPException(status_code=404, detail="LearningPath not found")

    # 将 ORM 的 path_items 映射为 schema
    items: List[PathItemInLearningPathResponse] = []
    for it in lp.path_items:
        res = getattr(it, "resource", None)
        resource_data = _to_resource_response(res) if res is not None else None
        items.append(
            PathItemInLearningPathResponse(
                id=it.id,
                learning_path_id=it.learning_path_id,
                resource_id=it.resource_id,
                resource_type=_to_resource_kind(res),
                title=(getattr(res, "title", None) or f"Resource {it.resource_id}"),
                order_index=it.order_index,
                stage=getattr(it, "stage", None),
                purpose=getattr(it, "purpose", None),
                estimated_time=getattr(it, "estimated_time", None),
                is_optional=bool(getattr(it, "is_optional", False)),
                manual_weight=getattr(it, "manual_weight", None),
                resource_data=resource_data,
            )
        )

    return LearningPathDetailResponse(
        id=lp.id,
        title=lp.title,
        type=getattr(lp, "type", None),
        description=lp.description,
        is_public=lp.is_public,
        cover_image_url=getattr(lp, "cover_image_url", None),
        category_id=getattr(lp, "category_id", None),
        category_name=getattr(lp, "category_name", None),
        is_active=lp.is_active,
        path_items=items,
    )


@router.delete("/{learning_path_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_path(
    learning_path_id: int,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    lp = _ensure_ownership(db, current_user.id, learning_path_id)
    try:
        LearningPathCURD.delete_learning_path(db, lp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete learning path")
    return None


@router.patch("/{learning_path_id}", response_model=LearningPathResponse)
def update_learning_path(
    learning_path_id: int,
    payload: LearningPathUpdate,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    lp = _ensure_ownership(db, current_user.id, learning_path_id)

    # Apply partial updates.
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(lp, key, value)

    # Auto-set published_at when status changes to published
    if data.get("status") == "published" and lp.published_at is None:
        from datetime import datetime
        lp.published_at = datetime.utcnow()

    try:
        db.add(lp)
        db.commit()
        db.refresh(lp)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"更新失败: {e}")

    return lp


@router.post(
    "/{learning_path_id}/fork",
    response_model=LearningPathResponse,
    status_code=status.HTTP_201_CREATED,
)
def fork_learning_path(
    learning_path_id: int,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    """Fork a public learning path to the current user's account."""
    # Check if user already forked this path
    existing_fork = (
        db.query(LearningPath)
        .filter(
            LearningPath.parent_id == learning_path_id,
            LearningPath.creator_id == current_user.id,
        )
        .first()
    )
    if existing_fork:
        raise HTTPException(
            status_code=409,
            detail="You have already forked this path",
        )
    try:
        forked_path = LearningPathCURD.fork_learning_path(
            db=db,
            source_learning_path_id=learning_path_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Fork failed: {e}")
    return forked_path


@router.post(
    "/{learning_path_id}/items",
    response_model=PathItemInLearningPathResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_resource_to_learning_path(
    learning_path_id: int,
    payload: AddResourceToLearningPathRequest,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    _ensure_ownership(db, current_user.id, learning_path_id)

    try:
        item = LearningPathCURD.add_resource_to_learning_path(
            db=db,
            learning_path_id=learning_path_id,
            resource_id=payload.resource_id,
            order_index=payload.order_index,
            stage=payload.stage,
            purpose=payload.purpose,
            estimated_time=payload.estimated_time,
            is_optional=payload.is_optional,
            manual_weight=payload.manual_weight,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Ensure any failed transaction is rolled back before returning.
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"添加失败: {e}")
    res = db.query(Resource).filter(Resource.id == item.resource_id).first()
    return PathItemInLearningPathResponse(
        id=item.id,
        learning_path_id=item.learning_path_id,
        resource_id=item.resource_id,
        resource_type=_to_resource_kind(res),
        title=(getattr(res, "title", None) or f"Resource {item.resource_id}"),
        order_index=item.order_index,
        stage=getattr(item, "stage", None),
        purpose=getattr(item, "purpose", None),
        estimated_time=getattr(item, "estimated_time", None),
        is_optional=bool(getattr(item, "is_optional", False)),
        manual_weight=getattr(item, "manual_weight", None),
        resource_data=None,
    )


@router.delete("/{learning_path_id}/items/{resource_id}")
def remove_resource_from_learning_path(
    learning_path_id: int,
    resource_id: int,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    _ensure_ownership(db, current_user.id, learning_path_id)
    ok = LearningPathCURD.remove_resource_from_learning_path(
        db, learning_path_id, resource_id
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Path item not found")
    return {"success": True}


@router.get(
    "/{learning_path_id}/items", response_model=List[PathItemInLearningPathResponse]
)
def list_path_items(
    learning_path_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
):
    _ensure_ownership(db, current_user.id, learning_path_id)
    items = PathItemCURD.list_by_learning_path(
        db, learning_path_id, skip=skip, limit=limit
    )
    return [
        PathItemInLearningPathResponse(
            id=it.id,
            learning_path_id=it.learning_path_id,
            resource_id=it.resource_id,
            resource_type=_to_resource_kind(getattr(it, "resource", None)),
            title=(
                getattr(getattr(it, "resource", None), "title", None)
                or f"Resource {it.resource_id}"
            ),
            order_index=it.order_index,
            stage=getattr(it, "stage", None),
            purpose=getattr(it, "purpose", None),
            estimated_time=getattr(it, "estimated_time", None),
            is_optional=bool(getattr(it, "is_optional", False)),
            manual_weight=getattr(it, "manual_weight", None),
            resource_data=None,
        )
        for it in items
    ]
