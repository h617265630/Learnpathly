"""
Step 1: Generate outline for a learning path.

Simplified Flow:
  topic → search → generate outline (direct, no page fetching)

Each step can be run independently or chained as a workflow.
"""

from __future__ import annotations
import asyncio
from typing import List

from ai_path.models.schemas import (
    GenPathState, SearchQuery, SearchResult,
    LearningOutline, OutlineSection,
)
from ai_path.tools.search import web_search
from ai_path.utils.llm import get_llm, parse_json_response


# ── Query count by depth ──────────────────────────────────────────────────────
_QUERY_COUNTS = {
    "quick": 4,
    "standard": 6,
    "rich": 8,
}


# ── Step 1a: Generate search queries ─────────────────────────────────────────

async def generate_queries(
    topic: str,
    level: str = "intermediate",
    resource_count: str = "standard",
    content_type: str = "mixed",
) -> List[SearchQuery]:
    """Generate diverse search queries based on topic and preferences."""
    n_queries = _QUERY_COUNTS.get(resource_count, 6)

    content_hints = {
        "video": "视频教程 课程",
        "article": "文章 博客 教程",
        "mixed": "教程 学习 资料",
    }
    content_hint = content_hints.get(content_type, content_hints["mixed"])

    # Build search queries
    queries = [
        f"{topic} {content_hint}",
        f"{topic} 入门 基础",
        f"{topic} 实战 项目",
        f"{topic} 最佳实践",
        f"site:github.com {topic}",
        f"{topic} 官方文档",
    ][:n_queries]

    # Use LLM to generate better queries
    prompt = f"""为「{topic}」生成 {n_queries} 个精确的搜索查询。

主题：{topic}
难度：{level}
内容类型：{content_type}

要求：
- 多样化角度：概述、入门教程、实战项目、官方文档、GitHub开源项目
- 至少1个 GitHub 查询
- 返回 JSON 数组：{{"query": "搜索词", "purpose": "目的"}}

示例：
[
  {{"query": "Python asyncio tutorial for beginners", "purpose": "入门教程"}},
  {{"query": "site:github.com python asyncio", "purpose": "GitHub项目"}}
]"""

    try:
        llm = get_llm(temperature=0.5)
        response = llm.invoke(prompt)
        parsed = parse_json_response(response.content)

        if isinstance(parsed, list):
            return [
                SearchQuery(query=item["query"], purpose=item.get("purpose", ""))
                for item in parsed
                if isinstance(item, dict) and "query" in item
            ]
    except Exception:
        pass

    # Fallback: simple queries
    return [
        SearchQuery(query=q, purpose="搜索")
        for q in queries
    ]


# ── Step 1b: Run web search ─────────────────────────────────────────────────

async def search_web(
    queries: List[SearchQuery],
    exclude_urls: list[str] | None = None,
) -> tuple[List[SearchResult], set[str]]:
    """Run search queries concurrently, return results + all discovered URLs."""
    exclude_set = set(exclude_urls or [])

    def _run_query(query: str) -> List[SearchResult]:
        try:
            return web_search(query, max_results=5)
        except Exception:
            return []

    # Run all queries concurrently
    loop = asyncio.get_event_loop()
    results_lists = await asyncio.gather(
        *[loop.run_in_executor(None, _run_query, q.query) for q in queries]
    )

    seen: set[str] = exclude_set.copy()
    all_results: List[SearchResult] = []
    discovered: set[str] = exclude_set.copy()

    for results in results_lists:
        for r in results:
            if r.url and r.url not in seen:
                seen.add(r.url)
                discovered.add(r.url)
                all_results.append(r)

    return all_results, discovered


# ── Step 1c: Generate outline from search results ───────────────────────────

async def generate_outline(
    topic: str,
    level: str,
    search_results: List[SearchResult],
    learning_depth: str = "standard",
    practical_ratio: str = "balanced",
) -> LearningOutline:
    """Generate learning outline directly from search results (no page fetching)."""
    # Section count by depth
    depth_sections = {"quick": (2, 3), "standard": (3, 5), "deep": (5, 7)}
    min_s, max_s = depth_sections.get(learning_depth, (3, 5))

    # Practical ratio hint
    ratio_hints = {
        "theory_first": "先打牢理论基础，再进入实践",
        "balanced": "理论与实践交替进行",
        "practice_first": "以实践为主，理论为辅",
    }

    # Build search snippets text for LLM
    snippets_text = "\n".join([
        f"- {r.title}: {r.snippet[:200]}"
        for r in search_results[:10]
    ]) if search_results else "（暂无搜索结果）"

    prompt = f"""根据搜索结果，为「{topic}」设计一个学习大纲。

主题：{topic}
难度级别：{level}
章节数量：{min_s}-{max_s} 章
学习风格：{ratio_hints.get(practical_ratio, "")}

搜索到的资源（可作为参考）：
{snippets_text}

请返回以下 JSON 格式（不要加 markdown 代码块）：
{{
  "overview": "整体学习路径的简短描述（1-2句话）",
  "total_duration_hours": 总学习时长估算（小时，浮点数）,
  "sections": [
    {{
      "title": "第X章：章节标题",
      "description": "本章学习内容概述",
      "learning_goals": ["学习目标1", "学习目标2"],
      "search_queries": ["本章内容相关的精确搜索词1", "搜索词2"],
      "order": 序号（从0开始）
    }}
  ]
}}"""

    try:
        llm = get_llm(temperature=0.4)
        response = llm.invoke(prompt)
        parsed = parse_json_response(response.content)

        return LearningOutline(
            topic=topic,
            level=level,
            overview=parsed.get("overview", ""),
            total_duration_hours=float(parsed.get("total_duration_hours", 0)),
            sections=[OutlineSection(**s) for s in parsed.get("sections", [])],
        )
    except Exception:
        # Fallback: simple single-section outline
        return LearningOutline(
            topic=topic,
            level=level,
            overview=f"学习 {topic} 的完整路径",
            total_duration_hours=len(search_results) * 0.5,
            sections=[
                OutlineSection(
                    title=f"第一章：{topic} 入门",
                    description=f"学习 {topic} 的基础知识",
                    learning_goals=[f"理解 {topic} 的基本概念"],
                    search_queries=[topic],
                    order=0,
                )
            ],
        )


# ── Main Step 1 orchestrator ─────────────────────────────────────────────────

async def run_step1(
    topic: str,
    level: str = "intermediate",
    learning_depth: str = "standard",
    content_type: str = "mixed",
    practical_ratio: str = "balanced",
    resource_count: str = "standard",
    exclude_urls: list[str] | None = None,
) -> dict:
    """
    Run Step 1: generate outline from topic (simplified).

    Returns:
        {
            "outline": LearningOutline,
            "search_results": List[SearchResult],
            "discovered_urls": List[str],
            "exclude_urls": List[str],  # cumulative
        }
    """
    # Generate queries
    queries = await generate_queries(
        topic=topic,
        level=level,
        resource_count=resource_count,
        content_type=content_type,
    )

    # Run search
    search_results, discovered = await search_web(queries, exclude_urls)

    # Generate outline
    outline = await generate_outline(
        topic=topic,
        level=level,
        search_results=search_results,
        learning_depth=learning_depth,
        practical_ratio=practical_ratio,
    )

    # Cumulative exclude URLs
    all_exclude = list(set((exclude_urls or []) + list(discovered)))

    return {
        "outline": outline,
        "search_results": search_results,
        "discovered_urls": list(discovered),
        "exclude_urls": all_exclude,
    }
