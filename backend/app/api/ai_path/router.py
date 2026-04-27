from __future__ import annotations

import asyncio
import sys
from pathlib import Path
import re

# Ensure ai_path is importable
_AI_PATH_ROOT = Path(__file__).resolve().parents[4]
if str(_AI_PATH_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_PATH_ROOT))

from fastapi import APIRouter, Depends, HTTPException, Response
from app.core.deps import get_db_dep
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser

from .service import generate_ai_path_pipeline, generate_ai_path_outline, generate_section_tutorial, search_resources_pipeline
from app.models.ai_path_project import AiPathProject
from app.models.ai_path_section import AiPathSection
from app.models.ai_path_subnode import AiPathSubNode
from app.models.ai_path_subnode_detail import AiPathSubNodeDetail
from app.models.ai_path_subnode_detail_cache import AiPathSubNodeDetailCache
import hashlib


router = APIRouter(prefix="/ai-path", tags=["ai-path"])


def _normalize_overview_text(text: str) -> str:
    """
    Normalize overview/summary text to be direct (no meta narration like
    'This learning path guides ...').
    """
    import re as _re

    s = (text or "").strip()
    if not s:
        return ""

    lowered = s.lower()
    if lowered.startswith("this learning path") or lowered.startswith("this course") or lowered.startswith("this path"):
        s2 = _re.sub(
            r"(?is)^\s*this\s+(learning\s+path|course|path)\s+"
            r"(guides|helps|walks|takes|teaches|shows)\s+"
            r".{0,160}?\s+(through|to)\s+",
            "",
            s,
            count=1,
        ).strip()
        if s2:
            s = s2
        s = _re.sub(r"(?is)^\s*this\s+(learning\s+path|course|path)\s+", "", s).strip()

    if s:
        s = s[0].upper() + s[1:]
    return s


_RE_CJK = re.compile(r"[\u4e00-\u9fff]")
_RE_LATIN = re.compile(r"[A-Za-z]")


def _looks_english_text(text: str) -> bool:
    s = (text or "").strip()
    if not s:
        return False
    if _RE_CJK.search(s):
        return False
    return bool(_RE_LATIN.search(s))


def _wants_english_detail(payload: "SubNodeDetailRequest") -> bool:
    # Heuristic: if topic/subnode title looks English, we treat the request as "want English".
    return _looks_english_text(payload.topic) or _looks_english_text(payload.subnode_title)


class AiPathGenerateRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User natural-language goal")
    exclude_urls: list[str] = Field(default_factory=list, description="URLs to exclude from results (for shuffle)")
    # Preferences — passed directly to the ai_path pipeline
    level: str | None = Field(default=None, description="beginner | intermediate | advanced")
    learning_depth: str | None = Field(default=None, description="quick | standard | deep")
    content_type: str | None = Field(default=None, description="video | article | mixed")
    practical_ratio: str | None = Field(default=None, description="theory_first | balanced | practice_first")


class AiPathGenerateResponse(BaseModel):
    project_id: int | None = None
    data: dict
    warnings: list[str] = Field(default_factory=list)

class AiPathProjectListItem(BaseModel):
    id: int
    topic: str
    outline_overview: str = ""
    created_at: str | None = None


class SectionTutorialRequest(BaseModel):
    """Request to generate a detailed tutorial for a specific section."""
    query: str = Field(..., min_length=1, description="Original user learning goal")
    section_title: str = Field(..., description="Section title")
    section_goal: str = Field(..., description="Section description/learning goal")
    resource_urls: list[str] = Field(default_factory=list, description="URLs of resources in this section")
    level: str = Field(default="beginner", description="Learning level")


class SectionTutorialResponse(BaseModel):
    """Response with generated tutorial content."""
    tutorial: str = Field(..., description="LLM-generated detailed tutorial in markdown")
    key_points: list[str] = Field(default_factory=list, description="Key points extracted from resources")


def _build_ai_path_workflow_info() -> dict:
    return {
        "name": "ai_path_workflow_info",
        "version": "2026-04-27",
        "summary": {
            "generate_button": "/ai-path 页面点击 Generate 时，会调用 POST /ai-path/generate-outline。",
            "subnode_click": "/ai-path-detail 页面点击子知识点时，会调用 POST /ai-path/subnode-detail。",
            "primary_storage": "生成的大纲、sub_nodes 和已生成的 subnode detail 会持久化保存到 PostgreSQL 的 ai_path_* 表。",
            "frontend_cache": "前端还会把最近一次响应临时保存到 sessionStorage，作为页面 fallback。",
        },
        "frontends": {
            "ai_path_page": {
                "url": "http://localhost:5175/ai-path",
                "component": "frontend/src/modules/ai-path/pages/AIPath.tsx",
                "service_function": "generateAiPath",
                "service_file": "frontend/src/services/aiPath.ts",
                "api": {
                    "method": "POST",
                    "path": "/ai-path/generate-outline",
                    "timeout_ms": 120000,
                },
                "does": [
                    "收集表单里的学习目标和偏好配置。",
                    "调用 POST /ai-path/generate-outline。",
                    "把 API 响应临时保存到 sessionStorage，key 是 learnsmart_ai_path_result_v1。",
                    "如果后端返回 project_id，就跳转到 /ai-path-detail?project_id={project_id}。",
                ],
                "storage": {
                    "database": {
                        "used": True,
                        "role": "生成后的 outline 和 sub_nodes 的主要持久化存储",
                        "tables": [
                            "ai_path_projects",
                            "ai_path_sections",
                            "ai_path_subnodes",
                            "ai_path_subnode_details",
                        ],
                    },
                    "sessionStorage": {
                        "used": True,
                        "role": "前端最近一次响应的临时 fallback/cache",
                        "key": "learnsmart_ai_path_result_v1",
                    },
                    "file_cache": {
                        "used": False,
                        "role": "generate-outline 返回的大纲不依赖文件缓存",
                    },
                },
                "backend_steps": [
                    {
                        "step": "Step 1a",
                        "name": "生成搜索关键词",
                        "code": "backend/ai_path/pipeline/step1_outline.py::generate_queries",
                        "description": "根据 topic、level、content_type、resource_count 生成搜索查询。",
                    },
                    {
                        "step": "Step 1b",
                        "name": "执行 Web 搜索",
                        "code": "backend/ai_path/pipeline/step1_outline.py::search_web",
                        "description": "执行 Web 搜索，并对发现的 URL 去重。",
                    },
                    {
                        "step": "Step 1c",
                        "name": "生成大纲和 sub_nodes",
                        "code": "backend/ai_path/pipeline/step1_outline.py::generate_outline",
                        "description": "调用当前配置的 LLM，一次性生成学习大纲和每个章节下的 sub_nodes。",
                    },
                    {
                        "step": "Persist",
                        "name": "保存生成项目",
                        "code": "backend/app/api/ai_path/router.py::generate_ai_path_outline_endpoint",
                        "description": "把 project、sections、sub_nodes 写入 PostgreSQL，并返回 project_id。",
                    },
                ],
                "output_shape": {
                    "project_id": "整数或 null",
                    "data.nodes": "前端展示为学习阶段的章节列表",
                    "data.nodes[].sub_nodes": "每个章节下的知识点/子节点",
                    "warnings": "生成和保存过程中的提示信息",
                },
            },
            "ai_path_detail_page": {
                "url": "http://localhost:5175/ai-path-detail",
                "component": "frontend/src/modules/ai-path/pages/AIPathDetail.tsx",
                "load_project_api": {
                    "by_id": "GET /ai-path/projects/{project_id}",
                    "latest_fallback": "GET /ai-path/projects/latest",
                },
                "subnode_detail_api": {
                    "method": "POST",
                    "path": "/ai-path/subnode-detail",
                    "timeout_ms": 180000,
                },
                "does": [
                    "URL 中存在 project_id 时，从 PostgreSQL 加载对应的大纲。",
                    "必要时 fallback 到 sessionStorage，或者读取数据库里最新的 project。",
                    "点击某个子知识点时，只请求这个 subnode 的详细内容。",
                    "Step 2.5 完成后展示 detailed_content 和 code_examples。",
                ],
                "storage": {
                    "database": {
                        "used": True,
                        "role": "从 ai_path_projects、ai_path_sections、ai_path_subnodes 读取 outline/sub_nodes",
                        "tables": [
                            "ai_path_projects",
                            "ai_path_sections",
                            "ai_path_subnodes",
                            "ai_path_subnode_details",
                        ],
                    },
                    "sessionStorage": {
                        "used": True,
                        "role": "已加载 project 响应的前端 fallback 缓存",
                        "key": "learnsmart_ai_path_result_v1",
                    },
                    "subnode_detail_cache": {
                        "used": True,
                        "role": "旧版标题缓存 fallback；主存储已经改为 ai_path_subnode_details",
                        "table": "ai_path_subnode_detail_cache",
                        "primary_table": "ai_path_subnode_details",
                        "cache_key": "md5(topic|section_title|subnode_title|detail_level)",
                    },
                    "file_cache": {
                        "used": True,
                        "role": "Step 2.5 pipeline 内部的辅助文件缓存",
                        "path": "backend/ai_path/result/subnode_cache",
                    },
                },
                "backend_steps": [
                    {
                        "step": "Load project",
                        "name": "从数据库读取大纲",
                        "api": "GET /ai-path/projects/{project_id}",
                        "description": "返回已保存的 project、sections、sub_nodes，用于页面展示。",
                    },
                    {
                        "step": "Step 2.5a",
                        "name": "检查 subnode 强关联详情",
                        "code": "backend/app/api/ai_path/router.py::generate_subnode_detail_endpoint",
                        "description": "调用 LLM 前，先按 subnode_id + detail_level 检查 ai_path_subnode_details 是否已有结果；旧数据会 fallback 到 ai_path_subnode_detail_cache。",
                    },
                    {
                        "step": "Step 2.5b",
                        "name": "生成子知识点详情",
                        "code": "backend/ai_path/pipeline/step2_5_subnode_detail.py::run_step2_5",
                        "description": "为被点击的 subnode 生成详细 Markdown 讲解和代码示例。",
                    },
                    {
                        "step": "Step 2.5c",
                        "name": "保存子知识点详情",
                        "code": "backend/app/api/ai_path/router.py::generate_subnode_detail_endpoint",
                        "description": "把 generated detailed_content/code_examples 写入 ai_path_subnode_details，并同步写入旧 cache 表兼容老数据。",
                    },
                ],
            },
            "admin_ai_outline_page": {
                "url": "http://localhost:5175/admin/ai-outline",
                "component": "frontend/src/modules/admin/pages/AiOutlineGenerator.tsx",
                "api": {
                    "method": "POST",
                    "path": "/ai-path/generate-outline",
                    "same_as_frontend_generate": True,
                },
                "does": [
                    "调用和前台 /ai-path 页面相同的 generate-outline API。",
                    "展示返回的 project_id、sections、sub_nodes，方便管理端检查。",
                    "目前不会自动为所有 sub_nodes 批量执行 Step 2.5。",
                ],
            },
        },
        "current_limitations": [
            "POST /ai-path/generate-outline 只生成 outline + sub_nodes，不会自动为每个 subnode 生成 Step 2.5 详情。",
            "Step 2.5 目前是懒加载：用户在详情页点击某个子知识点时才会执行。",
            "生成出来的 AI Path project 目前还没有发布到正式的 learning_paths/path_items 表。",
        ],
        "recommended_next_api_if_needed": {
            "path": "/ai-path/projects/{project_id}/generate-subnode-details",
            "purpose": "为某个 project 下的所有 sub_nodes 批量执行 Step 2.5，并把详情内容持久化到 ai_path_subnode_details。",
        },
    }


def _render_ai_path_workflow_markdown(info: dict) -> str:
    generate = info["frontends"]["ai_path_page"]
    detail = info["frontends"]["ai_path_detail_page"]
    admin = info["frontends"]["admin_ai_outline_page"]

    def bullet(items: list[str]) -> str:
        return "\n".join(f"- {item}" for item in items)

    def backend_steps(steps: list[dict]) -> str:
        lines: list[str] = []
        for step in steps:
            label = step.get("step", "")
            name = step.get("name", "")
            api = step.get("api")
            code = step.get("code")
            desc = step.get("description", "")
            lines.append(f"### {label}: {name}")
            if api:
                lines.append(f"- API: `{api}`")
            if code:
                lines.append(f"- 代码位置: `{code}`")
            lines.append(f"- 做了什么: {desc}")
            lines.append("")
        return "\n".join(lines).strip()

    return f"""# AI Path 工作流说明

版本: `{info["version"]}`

## 总览

- Generate 按钮: {info["summary"]["generate_button"]}
- 子知识点点击: {info["summary"]["subnode_click"]}
- 主要存储: {info["summary"]["primary_storage"]}
- 前端缓存: {info["summary"]["frontend_cache"]}

## `/ai-path` 页面 Generate 按钮

- 页面: `{generate["url"]}`
- 前端组件: `{generate["component"]}`
- Service 函数: `{generate["service_function"]}`
- Service 文件: `{generate["service_file"]}`
- API: `{generate["api"]["method"]} {generate["api"]["path"]}`
- 超时时间: `{generate["api"]["timeout_ms"]}ms`

### 做了什么

{bullet(generate["does"])}

### 存储方式

- 数据库: `{generate["storage"]["database"]["used"]}`  
  作用: {generate["storage"]["database"]["role"]}  
  表: {", ".join(f"`{table}`" for table in generate["storage"]["database"]["tables"])}
- sessionStorage: `{generate["storage"]["sessionStorage"]["used"]}`  
  作用: {generate["storage"]["sessionStorage"]["role"]}  
  Key: `{generate["storage"]["sessionStorage"]["key"]}`
- 文件缓存: `{generate["storage"]["file_cache"]["used"]}`  
  作用: {generate["storage"]["file_cache"]["role"]}

### 后端步骤

{backend_steps(generate["backend_steps"])}

### 返回结构

- `project_id`: {generate["output_shape"]["project_id"]}
- `data.nodes`: {generate["output_shape"]["data.nodes"]}
- `data.nodes[].sub_nodes`: {generate["output_shape"]["data.nodes[].sub_nodes"]}
- `warnings`: {generate["output_shape"]["warnings"]}

## `/ai-path-detail` 页面加载与子知识点点击

- 页面: `{detail["url"]}`
- 前端组件: `{detail["component"]}`
- 按 ID 加载: `{detail["load_project_api"]["by_id"]}`
- 最新 project fallback: `{detail["load_project_api"]["latest_fallback"]}`
- 子知识点详情 API: `{detail["subnode_detail_api"]["method"]} {detail["subnode_detail_api"]["path"]}`
- 子知识点详情超时时间: `{detail["subnode_detail_api"]["timeout_ms"]}ms`

### 做了什么

{bullet(detail["does"])}

### 存储方式

- 数据库: `{detail["storage"]["database"]["used"]}`  
  作用: {detail["storage"]["database"]["role"]}  
  表: {", ".join(f"`{table}`" for table in detail["storage"]["database"]["tables"])}
- sessionStorage: `{detail["storage"]["sessionStorage"]["used"]}`  
  作用: {detail["storage"]["sessionStorage"]["role"]}  
  Key: `{detail["storage"]["sessionStorage"]["key"]}`
- 子知识点详情缓存: `{detail["storage"]["subnode_detail_cache"]["used"]}`  
  作用: {detail["storage"]["subnode_detail_cache"]["role"]}  
  主表: `{detail["storage"]["subnode_detail_cache"]["primary_table"]}`  
  旧缓存表: `{detail["storage"]["subnode_detail_cache"]["table"]}`  
  Cache key: `{detail["storage"]["subnode_detail_cache"]["cache_key"]}`
- 文件缓存: `{detail["storage"]["file_cache"]["used"]}`  
  作用: {detail["storage"]["file_cache"]["role"]}  
  路径: `{detail["storage"]["file_cache"]["path"]}`

### 后端步骤

{backend_steps(detail["backend_steps"])}

## 管理端 AI 大纲生成页面

- 页面: `{admin["url"]}`
- 前端组件: `{admin["component"]}`
- API: `{admin["api"]["method"]} {admin["api"]["path"]}`
- 是否和前台 Generate 使用同一 API: `{admin["api"]["same_as_frontend_generate"]}`

### 做了什么

{bullet(admin["does"])}

## 当前限制

{bullet(info["current_limitations"])}

## 推荐下一步 API

- 路径: `{info["recommended_next_api_if_needed"]["path"]}`
- 目的: {info["recommended_next_api_if_needed"]["purpose"]}
"""


@router.get("/workflow-info")
async def get_ai_path_workflow_info():
    """
    Explain the current ai-path frontend/API workflow as JSON.

    This endpoint is intentionally read-only. It documents what the current
    frontend buttons call, which steps run, and where data is cached or stored.
    """
    return _build_ai_path_workflow_info()


@router.get("/workflow-info.md")
async def get_ai_path_workflow_info_markdown():
    """Explain the current ai-path frontend/API workflow as Markdown."""
    info = _build_ai_path_workflow_info()
    return Response(
        content=_render_ai_path_workflow_markdown(info),
        media_type="text/markdown; charset=utf-8",
    )


@router.post("/generate", response_model=AiPathGenerateResponse)
async def generate_ai_path(payload: AiPathGenerateRequest):
    """Generate a learning path using the ai_path pipeline (search → summarise → organize → report)."""
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    try:
        prefs = {
            k: v for k, v in {
                "level": payload.level,
                "learning_depth": payload.learning_depth,
                "content_type": payload.content_type,
                "practical_ratio": payload.practical_ratio,
            }.items()
            if v is not None
        }
        data, warnings = await generate_ai_path_pipeline(query, prefs)
        return AiPathGenerateResponse(data=data, warnings=warnings)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"ai_path pipeline failed: {exc}"
        ) from exc


@router.post("/generate-outline", response_model=AiPathGenerateResponse)
async def generate_ai_path_outline_endpoint(
    payload: AiPathGenerateRequest,
    db=Depends(get_db_dep),
):
    """
    Generate only the learning path outline (search → summarise only, skip organize/report).
    Much faster. Returns stages grouped by learning_stage with resources.
    User can then call /section-tutorial for each stage to get detailed content.
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    try:
        prefs = {
            k: v for k, v in {
                "level": payload.level,
                "learning_depth": payload.learning_depth,
                "content_type": payload.content_type,
                "practical_ratio": payload.practical_ratio,
            }.items()
            if v is not None
        }
        data, warnings = await generate_ai_path_outline(query, prefs)

        # Persist outline + subnodes for admin/batch generation workflows.
        project_id: int | None = None
        try:
            project_topic = str(data.get("title") or "").strip() or query
            project = AiPathProject(
                user_id=None,
                topic=project_topic,
                level=prefs.get("level") or "intermediate",
                learning_depth=prefs.get("learning_depth") or "standard",
                content_type=prefs.get("content_type") or "mixed",
                practical_ratio=prefs.get("practical_ratio") or "balanced",
                resource_count="standard",
                status="outline_generated",
                outline_overview=(data.get("summary") or ""),
                total_duration_hours=(data.get("_raw") or {}).get("total_duration_hours"),
                raw_outline_json=(data.get("_raw") or {}),
                raw_result_json=data,
            )
            db.add(project)
            db.flush()  # allocate project.id

            nodes = data.get("nodes") or []
            if isinstance(nodes, list):
                for sec_idx, node in enumerate(nodes):
                    if not isinstance(node, dict):
                        continue
                    section = AiPathSection(
                        project_id=project.id,
                        order_index=int(node.get("order", sec_idx) or sec_idx),
                        title=str(node.get("title") or f"Stage {sec_idx + 1}"),
                        description=str(node.get("description") or ""),
                        learning_goals=node.get("learning_points") or [],
                        search_queries=node.get("search_queries") or [],
                        estimated_minutes=node.get("estimated_minutes") or None,
                    )
                    db.add(section)
                    db.flush()

                    sub_nodes = node.get("sub_nodes") or []
                    if isinstance(sub_nodes, list):
                        for sub_idx, sub in enumerate(sub_nodes):
                            if not isinstance(sub, dict):
                                continue
                            subnode = AiPathSubNode(
                                section_id=section.id,
                                order_index=sub_idx,
                                title=str(sub.get("title") or f"SubNode {sub_idx + 1}"),
                                description=str(sub.get("description") or ""),
                                key_points=sub.get("learning_points") or [],
                                practical_exercise=str(sub.get("practical_exercise") or ""),
                                search_keywords=sub.get("search_keywords") or [],
                            )
                            db.add(subnode)

            db.commit()
            project_id = project.id
            warnings.append(f"Saved outline to DB (ai_path_projects.id={project.id})")
        except Exception as exc:
            try:
                db.rollback()
            except Exception:
                pass
            warnings.append(f"DB save skipped: {exc}")

        return AiPathGenerateResponse(project_id=project_id, data=data, warnings=warnings)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"ai_path outline failed: {exc}"
        ) from exc


# ── SubNode Detail (Step 2.5) ──────────────────────────────────────────────────

class SubNodeDetailRequest(BaseModel):
    """Request to generate detailed content for a sub-node."""
    subnode_id: int | None = Field(default=None, description="Persisted ai_path_subnodes.id")
    topic: str = Field(..., min_length=1, description="Main learning topic")
    section_title: str = Field(..., description="Parent section title")
    subnode_title: str = Field(..., description="Sub-node title")
    subnode_description: str = Field(default="", description="Sub-node description")
    subnode_key_points: list[str] = Field(default_factory=list, description="Key points")
    level: str = Field(default="intermediate", description="Learning level")
    detail_level: str = Field(default="detailed", description="concise | detailed")


class SubNodeDetailResponse(BaseModel):
    """Response with detailed sub-node content."""
    detail_id: int | None = None
    subnode_id: int | None = None
    title: str
    description: str
    key_points: list[str]
    detailed_content: str = Field(..., description="Detailed Markdown content")
    code_examples: list[str] = Field(default_factory=list)


def _upsert_subnode_detail(
    db,
    *,
    subnode_id: int,
    detail_level: str,
    detailed_content: str,
    code_examples: list[str],
    raw_json: dict,
) -> AiPathSubNodeDetail:
    detail = (
        db.query(AiPathSubNodeDetail)
        .filter(
            AiPathSubNodeDetail.subnode_id == subnode_id,
            AiPathSubNodeDetail.detail_level == detail_level,
        )
        .first()
    )
    if detail:
        detail.detailed_content = detailed_content
        detail.code_examples = code_examples
        detail.raw_json = raw_json
    else:
        detail = AiPathSubNodeDetail(
            subnode_id=subnode_id,
            detail_level=detail_level,
            detailed_content=detailed_content,
            code_examples=code_examples,
            raw_json=raw_json,
        )
        db.add(detail)

    db.commit()
    db.refresh(detail)
    return detail


def _subnode_detail_response_from_record(
    detail: AiPathSubNodeDetail,
    payload: SubNodeDetailRequest,
) -> SubNodeDetailResponse:
    raw = detail.raw_json or {}
    return SubNodeDetailResponse(
        detail_id=detail.id,
        subnode_id=detail.subnode_id,
        title=raw.get("title") or payload.subnode_title,
        description=raw.get("description") or payload.subnode_description,
        key_points=raw.get("key_points") or payload.subnode_key_points,
        detailed_content=detail.detailed_content or "",
        code_examples=detail.code_examples or [],
    )


@router.post("/subnode-detail", response_model=SubNodeDetailResponse)
async def generate_subnode_detail_endpoint(
    payload: SubNodeDetailRequest,
    db=Depends(get_db_dep),
):
    """Generate detailed content for a sub-node (Step 2.5). Called on-demand when user clicks a sub-node."""
    want_english = _wants_english_detail(payload)
    subnode: AiPathSubNode | None = None
    if payload.subnode_id:
        subnode = db.query(AiPathSubNode).filter(AiPathSubNode.id == payload.subnode_id).first()
        if not subnode:
            raise HTTPException(status_code=404, detail="Sub-node not found")

        linked_detail = (
            db.query(AiPathSubNodeDetail)
            .filter(
                AiPathSubNodeDetail.subnode_id == payload.subnode_id,
                AiPathSubNodeDetail.detail_level == payload.detail_level,
            )
            .first()
        )
        if linked_detail and linked_detail.detailed_content:
            # If client wants English but the stored detail is non-English (likely CJK),
            # regenerate and overwrite instead of returning stale content.
            if want_english and not _looks_english_text(linked_detail.detailed_content):
                linked_detail = None
            else:
                return _subnode_detail_response_from_record(linked_detail, payload)

    # Legacy title-based cache fallback for old clients/data.
    key_str = f"{payload.topic}|{payload.section_title}|{payload.subnode_title}|{payload.detail_level}"
    cache_key = hashlib.md5(key_str.encode()).hexdigest()

    cached = (
        db.query(AiPathSubNodeDetailCache)
        .filter(AiPathSubNodeDetailCache.cache_key == cache_key)
        .first()
    )
    if cached and cached.detailed_content:
        if want_english and not _looks_english_text(cached.detailed_content):
            cached = None
    if cached and cached.detailed_content:
        linked_detail_id: int | None = None
        if payload.subnode_id:
            try:
                linked_detail = _upsert_subnode_detail(
                    db,
                    subnode_id=payload.subnode_id,
                    detail_level=payload.detail_level,
                    detailed_content=cached.detailed_content,
                    code_examples=cached.code_examples or [],
                    raw_json=cached.raw_json or {},
                )
                linked_detail_id = linked_detail.id
            except Exception:
                try:
                    db.rollback()
                except Exception:
                    pass

        return SubNodeDetailResponse(
            detail_id=linked_detail_id,
            subnode_id=payload.subnode_id,
            title=payload.subnode_title,
            description=payload.subnode_description,
            key_points=payload.subnode_key_points,
            detailed_content=cached.detailed_content,
            code_examples=cached.code_examples or [],
        )

    # Generate via LLM (Step 2.5)
    try:
        from ai_path.pipeline.step2_5_subnode_detail import run_step2_5

        result = await run_step2_5(
            subnode={
                "title": payload.subnode_title,
                "description": payload.subnode_description,
                "key_points": payload.subnode_key_points,
            },
            section_title=payload.section_title,
            topic=payload.topic,
            level=payload.level,
            detail_level=payload.detail_level,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Sub-node detail generation failed: {exc}"
        ) from exc

    linked_detail_id: int | None = None

    # Save strong subnode_id-linked detail first.
    if payload.subnode_id:
        try:
            linked_detail = _upsert_subnode_detail(
                db,
                subnode_id=payload.subnode_id,
                detail_level=payload.detail_level,
                detailed_content=result.detailed_content,
                code_examples=result.code_examples,
                raw_json={
                    "title": result.title,
                    "description": result.description,
                    "key_points": result.key_points,
                    "detailed_content": result.detailed_content,
                    "code_examples": result.code_examples,
                },
            )
            linked_detail_id = linked_detail.id
        except Exception:
            try:
                db.rollback()
            except Exception:
                pass

    # Save legacy title-key cache too, so older clients still benefit.
    try:
        record = AiPathSubNodeDetailCache(
            cache_key=cache_key,
            topic=payload.topic,
            section_title=payload.section_title,
            subnode_title=payload.subnode_title,
            detail_level=payload.detail_level,
            detailed_content=result.detailed_content,
            code_examples=result.code_examples,
            raw_json={
                "title": result.title,
                "description": result.description,
                "key_points": result.key_points,
                "detailed_content": result.detailed_content,
                "code_examples": result.code_examples,
            },
        )
        db.add(record)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    return SubNodeDetailResponse(
        detail_id=linked_detail_id,
        subnode_id=payload.subnode_id,
        title=result.title,
        description=result.description,
        key_points=result.key_points,
        detailed_content=result.detailed_content,
        code_examples=result.code_examples,
    )


# ── DB-backed Outline Fetching ────────────────────────────────────────────────

def _project_to_response(project: AiPathProject) -> AiPathGenerateResponse:
    sections = list(project.sections or [])
    sections.sort(key=lambda section: (section.order_index or 0, section.id or 0))

    nodes: list[dict] = []
    for section in sections:
        subnodes = list(section.subnodes or [])
        subnodes.sort(key=lambda subnode: (subnode.order_index or 0, subnode.id or 0))
        nodes.append({
            "id": section.id,
            "project_id": project.id,
            "title": section.title,
            "description": section.description or "",
            "learning_points": section.learning_goals or [],
            "resources": [],
            "sub_nodes": [
                {
                    "id": subnode.id,
                    "section_id": subnode.section_id,
                    "title": subnode.title,
                    "description": subnode.description or "",
                    "learning_points": subnode.key_points or [],
                    "practical_exercise": subnode.practical_exercise or "",
                    "search_keywords": subnode.search_keywords or [],
                    "details": [
                        {
                            "id": detail.id,
                            "subnode_id": detail.subnode_id,
                            "detail_level": detail.detail_level,
                            "detailed_content": detail.detailed_content or "",
                            "code_examples": detail.code_examples or [],
                            "raw_json": detail.raw_json or {},
                        }
                        for detail in sorted(
                            list(subnode.details or []),
                            key=lambda item: (item.detail_level or "", item.id or 0),
                        )
                    ],
                    "resources": [],
                }
                for subnode in subnodes
            ],
            "order": section.order_index or 0,
            "estimated_minutes": section.estimated_minutes or 0,
        })

    overview = _normalize_overview_text(project.outline_overview or "")
    data = {
        "title": project.topic,
        "summary": overview,
        "description": overview,
        "recommendations": [
            f"{len(nodes)} chapters",
            f"~ {float(project.total_duration_hours or 0):.1f} hours",
        ],
        "nodes": nodes,
        "_raw": project.raw_outline_json or {},
        "_from_db": True,
    }
    return AiPathGenerateResponse(
        project_id=project.id,
        data=data,
        warnings=[f"Loaded from DB (ai_path_projects.id={project.id})"],
    )


@router.get("/projects/latest", response_model=AiPathGenerateResponse)
async def get_latest_ai_path_project(db=Depends(get_db_dep)):
    project = (
        db.query(AiPathProject)
        .order_by(AiPathProject.created_at.desc(), AiPathProject.id.desc())
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="No ai_path projects found")
    return _project_to_response(project)

@router.get("/projects", response_model=list[AiPathProjectListItem])
async def list_ai_path_projects(
    limit: int = 8,
    offset: int = 0,
    db=Depends(get_db_dep),
):
    limit = max(1, min(int(limit or 8), 50))
    offset = max(0, int(offset or 0))
    projects = (
        db.query(AiPathProject)
        .order_by(AiPathProject.created_at.desc(), AiPathProject.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items: list[AiPathProjectListItem] = []
    for p in projects:
        items.append(
            AiPathProjectListItem(
                id=p.id,
                topic=p.topic,
                outline_overview=_normalize_overview_text(p.outline_overview or ""),
                created_at=p.created_at.isoformat() if getattr(p, "created_at", None) else None,
            )
        )
    return items


@router.get("/projects/{project_id}", response_model=AiPathGenerateResponse)
async def get_ai_path_project(project_id: int, db=Depends(get_db_dep)):
    project = db.query(AiPathProject).filter(AiPathProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_to_response(project)


@router.post("/section-tutorial", response_model=SectionTutorialResponse)
async def generate_section_tutorial_endpoint(
    payload: SectionTutorialRequest,
    db=Depends(get_db_dep),
):
    """Generate a detailed tutorial for a specific section based on its resources."""
    try:
        result = await generate_section_tutorial(
            query=payload.query,
            section_title=payload.section_title,
            section_goal=payload.section_goal,
            resource_urls=payload.resource_urls,
            level=payload.level,
            db=db,
        )
        return SectionTutorialResponse(**result)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Section tutorial generation failed: {exc}"
        ) from exc


@router.get("/result/latest")
async def get_latest_result():
    """Load the most recent saved result from ai_path/result/."""
    import glob as _glob
    import json as _json
    from pathlib import Path
    _project_root = Path(__file__).resolve().parents[4]
    _result_dir = _project_root / "ai_path" / "result"
    files = sorted(_result_dir.glob("ai_path_outline_*.json"), reverse=True)
    if not files:
        raise HTTPException(status_code=404, detail="No saved results found")
    with open(files[0], "r", encoding="utf-8") as f:
        saved_data = _json.load(f)
    return AiPathGenerateResponse(data=saved_data, warnings=[])


@router.get("/result/{filename}")
async def get_saved_result(filename: str):
    """Load a previously saved result from ai_path/result/ for debugging."""
    import json as _json
    from pathlib import Path
    _project_root = Path(__file__).resolve().parents[4]
    _file_path = _project_root / "ai_path" / "result" / filename
    if not _file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    with open(_file_path, "r", encoding="utf-8") as f:
        saved_data = _json.load(f)
    return AiPathGenerateResponse(data=saved_data, warnings=[])


class AiResourceSearchResponse(BaseModel):
    data: list[dict]          # web / Tavily results
    github_results: list[dict] # GitHub API results
    topic: str


class CachedResultsResponse(BaseModel):
    data: list[dict]
    topic: str
    cached_count: int


def _transform_github_resource(r: dict) -> dict:
    """Transform a search_github result dict to the frontend AiResourceItem schema."""
    return {
        "url": r.get("url", ""),
        "title": r.get("title", ""),
        "description": r.get("description", ""),
        "key_points": [r.get("why_recommended", "")] if r.get("why_recommended") else [],
        "difficulty": "intermediate",
        "resource_type": "repo",
        "learning_stage": "core",
        "estimated_minutes": 30,
        "image": r.get("thumbnail") or None,
    }


@router.post("/search-resources", response_model=AiResourceSearchResponse)
async def search_resources(
    payload: AiPathGenerateRequest,
    db=Depends(get_db_dep),
):
    """Search Tavily (6 results) + GitHub API (6 results) in parallel, return two separate arrays."""
    topic = payload.query.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="query is required")

    try:
        exclude = set(payload.exclude_urls)

        # Run Tavily web search and GitHub API search concurrently (independent)
        tavily_task = _run_tavily_search(topic, exclude)
        github_task = _run_github_api_search(topic, exclude)
        outcomes = await _run_parallel(tavily_task, github_task)

        tavily_raw = outcomes[0] if not isinstance(outcomes[0], Exception) else []
        github_raw = outcomes[1] if not isinstance(outcomes[1], Exception) else []

        # Transform Tavily results → AiResourceItem shape
        tavily_results = [_transform_tavily_resource(r) for r in tavily_raw]

        # Transform GitHub API results → AiResourceItem shape
        github_results = [_transform_github_resource(r) for r in github_raw]

        return AiResourceSearchResponse(
            data=tavily_results,
            github_results=github_results,
            topic=topic,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Resource search failed: {exc}"
        ) from exc


async def _run_parallel(*tasks):
    return await asyncio.gather(*tasks, return_exceptions=True)


async def _run_tavily_search(topic: str, exclude: set[str] | None = None) -> list[dict]:
    """Run Tavily search in a thread pool to avoid blocking."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _sync_tavily_search, topic, exclude
    )


def _sync_tavily_search(topic: str, exclude: set[str] | None = None) -> list[dict]:
    """Tavily web search — returns 6 results, filtered of excluded URLs."""
    try:
        from ai_path.ai_resource.github import search_tavily_resources
        results = search_tavily_resources(topic, limit=6)
        if exclude:
            results = [r for r in results if r.get("url") not in exclude]
        return results[:6]
    except Exception:
        return []


async def _run_github_api_search(topic: str, exclude: set[str] | None = None) -> list[dict]:
    """Run GitHub API search in a thread pool to avoid blocking."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _sync_github_api_search, topic, exclude
    )


def _sync_github_api_search(topic: str, exclude: set[str] | None = None) -> list[dict]:
    """GitHub API repo search — returns 6 results, filtered of excluded URLs."""
    try:
        from ai_path.ai_resource.github import search_github
        results = search_github(topic, limit=6)
        if exclude:
            results = [r for r in results if r.get("url") not in exclude]
        return results[:6]
    except Exception:
        return []


def _transform_tavily_resource(r: dict) -> dict:
    """Transform a Tavily search result to the frontend AiResourceItem schema."""
    url = r.get("url", "")
    # Infer resource type from URL
    resource_type = "article"
    if "youtube.com" in url or "youtu.be" in url:
        resource_type = "video"
    elif "github.com" in url:
        resource_type = "repo"
    elif any(d in url for d in ["docs.", "/docs/", "documentation"]):
        resource_type = "docs"

    return {
        "url": url,
        "title": r.get("title", ""),
        "description": r.get("description", r.get("content", "")),
        "key_points": [r.get("why_recommended", "")] if r.get("why_recommended") else [],
        "difficulty": "intermediate",
        "resource_type": resource_type,
        "learning_stage": "core",
        "estimated_minutes": 15,
        "image": r.get("thumbnail") or None,
    }


@router.get("/cached-results/{topic}", response_model=CachedResultsResponse)
async def get_cached_results(
    topic: str,
    db=Depends(get_db_dep),
):
    """Return cached search results for a topic without hitting external APIs."""
    topic_clean = topic.strip()
    if not topic_clean:
        raise HTTPException(status_code=400, detail="topic is required")

    from app.curd.resource_summary_cache_curd import ResourceSummaryCacheCURD

    rows = ResourceSummaryCacheCURD.get_multi_by_topic(db, topic=topic_clean, limit=50)
    import json as _json

    results: list[dict] = []
    for hit in rows:
        results.append({
            "url": hit.url,
            "title": hit.title or "",
            "description": hit.summary or "",
            "key_points": _json.loads(hit.key_points) if hit.key_points else [],
            "difficulty": hit.difficulty or "beginner",
            "resource_type": hit.resource_type or "article",
            "learning_stage": hit.learning_stage or "core",
            "estimated_minutes": hit.estimated_minutes or 15,
            "image": hit.image,
        })

    return CachedResultsResponse(data=results, topic=topic_clean, cached_count=len(results))


# ── Debug / Step-by-step endpoints ─────────────────────────────────────────────

class Step1SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Learning topic")
    level: str = Field(default="beginner", description="Learning level")
    max_results: int = Field(default=10, description="Max resources to fetch")


class Step1SearchResponse(BaseModel):
    step: str = "step1_search"
    message: str
    resources_cached: int
    resources: list[dict]  # Full resource details with content


@router.post("/debug/step1-search", response_model=Step1SearchResponse)
async def debug_step1_search(
    payload: Step1SearchRequest,
    db=Depends(get_db_dep),
):
    """
    Step 1: Search for resources, fetch content, and save summaries to cache.
    Returns list of cached resource URLs for next steps.
    """
    try:
        from .service import search_resources_pipeline

        results = await search_resources_pipeline(
            topic=payload.query,
            max_results=payload.max_results,
            db=db,
            exclude_urls=[],
        )
        db.commit()

        return Step1SearchResponse(
            step="step1_search",
            message=f"Successfully cached {len(results)} resources for '{payload.query}'",
            resources_cached=len(results),
            resources=results,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Step 1 failed: {exc}") from exc


class Step2OutlineRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Learning topic")
    level: str = Field(default="beginner")


class Step2OutlineResponse(BaseModel):
    step: str = "step2_outline"
    message: str
    outline: dict


@router.post("/debug/step2-outline", response_model=Step2OutlineResponse)
async def debug_step2_outline(
    payload: Step2OutlineRequest,
    db=Depends(get_db_dep),
):
    """
    Step 2: Generate learning path outline from cached resources.
    Groups resources by learning_stage (foundation/core/practice/advanced).
    """
    try:
        from .service import generate_ai_path_outline

        data, warnings = await generate_ai_path_outline(
            query=payload.query,
            preferences={"level": payload.level},
        )
        db.commit()

        return Step2OutlineResponse(
            step="step2_outline",
            message=f"Generated outline with {len(data.get('nodes', []))} stages",
            outline=data,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Step 2 failed: {exc}") from exc


class Step3StageDetailRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Original learning topic")
    stage_title: str = Field(..., description="Stage title from outline")
    stage_goal: str = Field(..., description="Stage description/learning goal")
    resource_urls: list[str] = Field(default_factory=list, description="URLs of resources for this stage")
    level: str = Field(default="beginner")


class Step3StageDetailResponse(BaseModel):
    step: str = "step3_stage_detail"
    message: str
    tutorial: str
    key_points: list[str]


@router.post("/debug/step3-stage-detail", response_model=Step3StageDetailResponse)
async def debug_step3_stage_detail(
    payload: Step3StageDetailRequest,
    db=Depends(get_db_dep),
):
    """
    Step 3: Generate detailed knowledge point introduction and resource recommendations
    for a specific stage based on cached resources.
    """
    try:
        from .service import generate_section_tutorial

        result = await generate_section_tutorial(
            query=payload.query,
            section_title=payload.stage_title,
            section_goal=payload.stage_goal,
            resource_urls=payload.resource_urls,
            level=payload.level,
            db=db,
        )

        return Step3StageDetailResponse(
            step="step3_stage_detail",
            message=f"Generated detailed content for stage '{payload.stage_title}'",
            tutorial=result["tutorial"],
            key_points=result["key_points"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Step 3 failed: {exc}") from exc


class Step4StageSummaryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Learning topic")
    stage_title: str = Field(..., description="Stage title")
    stage_goal: str = Field(..., description="Stage description")
    tutorial: str = Field(..., description="Generated tutorial content")


class Step4StageSummaryResponse(BaseModel):
    step: str = "step4_stage_summary"
    message: str
    summary: str
    github_project_hints: list[str]


@router.post("/debug/step4-stage-summary", response_model=Step4StageSummaryResponse)
async def debug_step4_stage_summary(
    payload: Step4StageSummaryRequest,
    db=Depends(get_db_dep),
):
    """
    Step 4: Generate a concise summary for the stage and extract GitHub project hints.
    """
    try:
        import json as _json
        from ai_path.utils.llm import get_llm
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.prompts import ChatPromptTemplate

        prompt = ChatPromptTemplate.from_template("""Based on the following tutorial content for the stage "{stage_title}" about "{query}", provide:

1. A concise 2-3 sentence summary of what was covered
2. 3 GitHub project search keywords/phrases that would help practice this stage's content

Return JSON:
{{
  "summary": "concise summary here",
  "github_project_hints": ["keyword1", "keyword2", "keyword3"]
}}""")

        chain = prompt | get_llm(temperature=0.3) | JsonOutputParser()
        result = await chain.ainvoke({
            "query": payload.query,
            "stage_title": payload.stage_title,
            "tutorial": payload.tutorial[:2000],  # Limit input
        })

        return Step4StageSummaryResponse(
            step="step4_stage_summary",
            message=f"Generated summary for stage '{payload.stage_title}'",
            summary=result.get("summary", ""),
            github_project_hints=result.get("github_project_hints", []),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Step 4 failed: {exc}") from exc


class Step5GithubRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Learning topic")
    summaries: list[str] = Field(default_factory=list, description="Stage summaries for context")
    github_hints: list[str] = Field(default_factory=list, description="GitHub project search hints")


class Step5GithubResponse(BaseModel):
    step: str = "step5_github"
    message: str
    projects: list[dict]


@router.post("/debug/step5-github", response_model=Step5GithubResponse)
async def debug_step5_github(
    payload: Step5GithubRequest,
):
    """
    Step 5: Search GitHub for relevant open-source projects based on topic + summaries + hints.
    """
    try:
        from ai_path.ai_resource.github import search_github

        # Combine all search terms
        search_terms = [payload.query] + payload.summaries[:2] + payload.github_hints
        # Deduplicate and limit
        seen = set()
        unique_terms = []
        for term in search_terms:
            if term.lower() not in seen:
                seen.add(term.lower())
                unique_terms.append(term)
        search_term = " ".join(unique_terms[:5])

        projects = search_github(search_term, limit=6)

        return Step5GithubResponse(
            step="step5_github",
            message=f"Found {len(projects)} GitHub projects",
            projects=projects,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Step 5 failed: {exc}") from exc


# ── LLM-based Smart Outline Generator ─────────────────────────────────────────

async def _generate_smart_outline(
    topic: str,
    resources: list[dict],
    level: str = "beginner",
) -> tuple[dict[str, Any], list[str]]:
    """
    Use LLM to generate a proper structured Chinese learning path outline
    from the given resources.
    """
    import json as _json
    from ai_path.utils.llm import get_llm
    from langchain_core.output_parsers import JsonOutputParser
    from langchain_core.prompts import ChatPromptTemplate

    # Build resources text for prompt
    resources_text = []
    for i, r in enumerate(resources):
        title = r.get("title", "")
        url = r.get("url", "")
        summary = r.get("description", "")[:300]
        resources_text.append(f"{i+1}. {title}\n   URL: {url}\n   摘要: {summary}")

    resources_json_str = "\n".join(resources_text)

    # Depth config
    depth_config = {
        "quick": {"min_sections": 2, "max_sections": 3, "depth_instruction": "简洁明了，聚焦核心知识点"},
        "standard": {"min_sections": 3, "max_sections": 5, "depth_instruction": "平衡深度和广度，每个阶段有清晰的学习目标"},
        "deep": {"min_sections": 5, "max_sections": 7, "depth_instruction": "深入详细，包含前置知识、进阶内容和实践项目"},
    }
    depth_cfg = depth_config.get("standard")  # Default to standard

    # Build prompt with proper escaping using string concatenation
    # JSON example with escaped braces for LangChain
    json_example = (
        "{{\n"
        '  "overview": "整体学习路径概述（2-3句话）",\n'
        '  "total_duration_hours": 估算学习时长（小时数字），\n'
        "  \"sections\": [\n"
        "    {{\n"
        '      "title": "阶段名称（如：理解核心概念）",\n'
        '      "description": "阶段详细描述，说明学生完成此阶段后能做什么",\n'
        '      "learning_goals": ["可执行的学习目标1", "学习目标2", "学习目标3"],\n'
        '      "key_points": ["关键知识点1", "关键知识点2"],\n'
        "      \"resources\": [\n"
        '        {{"url": "资源URL", "title": "资源标题"}}\n'
        "      ],\n"
        '      "order": 1\n'
        "    }}\n"
        "  ]\n"
        "}}"
    )

    prompt_text = (
        "你是一位资深课程设计师，为学生设计一条清晰、高效的学习路径。\n\n"
        "## 学习主题\n"
        + topic + "\n\n"
        "## 学生水平\n"
        + level + "\n\n"
        "## 学习资源\n"
        + resources_json_str + "\n\n"
        "## 任务\n"
        "根据以上资源，设计一条结构清晰的学习路径大纲。\n\n"
        "## 要求\n"
        f"- 生成 {depth_cfg['min_sections']}-{depth_cfg['max_sections']} 个学习阶段\n"
        f"- {depth_cfg['depth_instruction']}\n"
        "- 每个阶段需要包含：阶段名称、详细描述、学习要点、推荐资源\n"
        "- 用中文回答\n"
        "- 阶段顺序：从基础概念 → 核心知识 → 实践应用 → 进阶主题\n\n"
        "## 输出格式（JSON，不要使用markdown代码块）\n"
        + json_example + "\n\n"
        "## 重要提示\n"
        "- 每个资源URL必须出现在某个阶段中\n"
        "- 阶段名称要具体、有意义，避免'阶段1'这样的泛泛名称\n"
        "- 学习目标要具体可衡量"
    )

    try:
        # Use PromptTemplate directly to avoid variable parsing issues
        from langchain_core.prompts import PromptTemplate
        prompt = PromptTemplate(template=prompt_text, input_variables=[])
        chain = prompt | get_llm(temperature=0.3) | JsonOutputParser()
        result = await chain.ainvoke({})

        sections = result.get("sections", [])
        overview = result.get("overview", "")
        total_hours = result.get("total_duration_hours", 0)

        # Transform to nodes format
        nodes = []
        for sec in sections:
            sec_resources = sec.get("resources", [])
            if not isinstance(sec_resources, list):
                sec_resources = []

            # Match resources by URL
            matched_resources = []
            for res in sec_resources:
                res_url = res.get("url", "") if isinstance(res, dict) else str(res)
                for r in resources:
                    if r.get("url") == res_url:
                        matched_resources.append({
                            "url": r.get("url", ""),
                            "title": r.get("title", ""),
                            "description": r.get("description", "")[:200],
                        })
                        break

            # Fallback: assign first 2 unmatched resources
            if len(matched_resources) < 2:
                for r in resources:
                    if r.get("url") not in [mr.get("url") for mr in matched_resources]:
                        matched_resources.append({
                            "url": r.get("url", ""),
                            "title": r.get("title", ""),
                            "description": r.get("description", "")[:200],
                        })
                        if len(matched_resources) >= 3:
                            break

            nodes.append({
                "title": sec.get("title", ""),
                "description": sec.get("description", ""),
                "learning_points": sec.get("learning_goals", []),
                "key_points": sec.get("key_points", []),
                "resources": matched_resources,
                "sub_nodes": [],
                "order": sec.get("order", len(nodes) + 1),
            })

        warnings = [f"Generated {len(nodes)} stages from {len(resources)} resources"]

        outline_data = {
            "title": topic,
            "summary": overview,
            "nodes": nodes,
            "recommendations": [
                f"预计学习时长：约 {total_hours} 小时",
                f"共 {len(nodes)} 个学习阶段",
            ],
            "total_duration_hours": total_hours,
            "_smart_outline": True,
        }

        return outline_data, warnings
    except Exception as exc:
        # No fallback - raise the error
        raise RuntimeError(f"Failed to generate smart outline: {exc}")


# ── Combined Step 1 + 2 ─────────────────────────────────────────────────────────

class CombinedRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Learning topic")
    level: str = Field(default="beginner", description="Learning level")
    max_results: int = Field(default=10, description="Max resources to fetch")
    save_to_file: bool = Field(default=True, description="Save result to ai_path/result directory")


class CombinedResponse(BaseModel):
    step: str = "combined_1_2"
    message: str
    resources: list[dict]
    outline: dict
    file_path: str | None = None


@router.post("/debug/combined", response_model=CombinedResponse)
async def debug_combined(
    payload: CombinedRequest,
    db=Depends(get_db_dep),
):
    """
    Step 1 + Step 2 combined: Search resources, cache, then generate outline.
    Optionally saves result to ai_path/result/{query_slug}_{timestamp}.json
    """
    try:
        import time
        import re
        from .service import search_resources_pipeline, generate_ai_path_outline

        # Step 1: Search and cache resources
        resources = await search_resources_pipeline(
            topic=payload.query,
            max_results=payload.max_results,
            db=db,
            exclude_urls=[],
        )
        db.commit()

        # Step 2: Generate smart outline with LLM (instead of simple grouping)
        outline_data, warnings = await _generate_smart_outline(
            topic=payload.query,
            resources=resources,
            level=payload.level,
        )
        db.commit()

        # Build combined result
        result = {
            "query": payload.query,
            "level": payload.level,
            "resources": resources,
            "outline": outline_data,
            "warnings": warnings,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }

        # Save to file if requested
        file_path = None
        if payload.save_to_file:
            from pathlib import Path
            # Create slug from query
            slug = re.sub(r"[^a-zA-Z0-9]+", "_", payload.query).lower()
            slug = slug[:50]  # Limit length
            timestamp = int(time.time())
            filename = f"{slug}_{timestamp}.json"
            result_dir = Path("/Users/burn/Code/path/ai_path/result")
            result_dir.mkdir(parents=True, exist_ok=True)
            file_path = result_dir / filename

            import json as _json
            with open(file_path, "w", encoding="utf-8") as f:
                _json.dump(result, f, ensure_ascii=False, indent=2)

        return CombinedResponse(
            step="combined_1_2",
            message=f"Generated outline with {len(outline_data.get('nodes', []))} stages from {len(resources)} resources",
            resources=resources,
            outline=outline_data,
            file_path=str(file_path) if file_path else None,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Combined failed: {exc}") from exc
