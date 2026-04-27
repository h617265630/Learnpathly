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
    """Generate diverse search queries based on topic and preferences (template only, no LLM)."""
    n_queries = _QUERY_COUNTS.get(resource_count, 6)

    content_hints = {
        "video": "video course tutorial",
        "article": "article blog tutorial",
        "mixed": "tutorial learning resources",
    }
    content_hint = content_hints.get(content_type, content_hints["mixed"])

    # Build search queries (template only, no LLM)
    queries = [
        f"{topic} {content_hint}",
        f"{topic} fundamentals",
        f"{topic} hands-on project",
        f"{topic} best practices",
        f"site:github.com {topic}",
        f"{topic} official documentation",
    ][:n_queries]

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
    """Generate learning outline with sub_nodes directly from search results (merged Step 1 + Step 2)."""
    # Section count by depth
    depth_sections = {"quick": (2, 3), "standard": (3, 5), "deep": (5, 7)}
    min_s, max_s = depth_sections.get(learning_depth, (3, 5))

    # Practical ratio hint
    ratio_hints = {
        "theory_first": "Build strong fundamentals first, then move into practice.",
        "balanced": "Alternate theory and practice.",
        "practice_first": "Prioritize hands-on practice with light theory.",
    }

    # Build search snippets text for LLM
    snippets_text = "\n".join(
        [f"- {r.title}: {r.snippet[:200]}" for r in search_results[:10]]
    ) if search_results else "(no search results)"

    # Merged prompt: generate outline + sub_nodes in one call
    prompt = f"""Based on the search results, design a complete learning path outline for "{topic}" (including sub-nodes/knowledge points).

Topic: {topic}
Level: {level}
Chapters: {min_s}-{max_s}
Learning style: {ratio_hints.get(practical_ratio, "")}

Resources found (for reference):
{snippets_text}

Return the following JSON only (no markdown code fences):
{{
  "title": "A short English title for the learning topic",
  "overview": "A brief overview of what you will learn/build (1-2 sentences).",
  "total_duration_hours": 12.5,
  "sections": [
    {{
      "title": "Chapter X: Title",
      "description": "A short chapter description (2-3 sentences).",
      "learning_goals": ["Goal 1", "Goal 2", "Goal 3"],
      "sub_nodes": [
        {{
          "title": "Sub-node title 1",
          "description": "What this knowledge point covers.",
          "key_points": ["Key point 1", "Key point 2", "Key point 3"]
        }},
        {{
          "title": "Sub-node title 2",
          "description": "What this knowledge point covers.",
          "key_points": ["Key point 1", "Key point 2"]
        }}
      ],
      "order": 0
    }}
  ]
}}

Requirements:
- Return all titles in English (including sections.title and sub_nodes[].title), even if the input topic is not English.
- Translate/normalize the input topic into a clear English learning topic title for the top-level title field.
- overview must be direct and concrete. Do NOT start with meta phrases like "This learning path...", "This course...", "In this path...".
- Preserve all goals, focus areas, tech stack, and intended outcomes from the user's topic. Do not over-focus on only the first tool keyword.
- If the topic includes multiple focus areas (e.g., Python, Pandas, visualization, real-world projects), each must be explicitly reflected in chapters or sub_nodes.
- Chapter titles should reflect the goal and stage capability, not just a tool name.
- Each chapter must include 2-4 sub_nodes.
- sub_nodes must be concrete and actionable.
- Write everything in English."""

    try:
        llm = get_llm(temperature=0.4)
        response = await llm.ainvoke(prompt)
        parsed = parse_json_response(response.content)

        # Build sections with sub_nodes
        sections = []
        for s in parsed.get("sections", []):
            # Build sub_nodes if present
            sub_nodes = []
            for sub in s.get("sub_nodes", []):
                from ai_path.models.schemas import SubNode
                sub_nodes.append(SubNode(
                    title=sub.get("title", ""),
                    description=sub.get("description", ""),
                    key_points=sub.get("key_points", []),
                    practical_exercise=sub.get("practical_exercise", ""),
                    search_keywords=sub.get("search_keywords", []),
                ))

            sections.append(OutlineSection(
                title=s.get("title", ""),
                description=s.get("description", ""),
                learning_goals=s.get("learning_goals", []),
                sub_nodes=sub_nodes,
                search_queries=s.get("search_queries", []),
                order=s.get("order", len(sections)),
            ))

        outline_title = str(parsed.get("title") or "").strip()
        return LearningOutline(
            title=outline_title,
            topic=topic,
            level=level,
            overview=parsed.get("overview", ""),
            total_duration_hours=float(parsed.get("total_duration_hours", 0)),
            sections=sections,
        )
    except Exception as exc:
        # Fail loudly so frontend shows an actionable error instead of fake instant outline.
        raise RuntimeError(f"Step1 outline generation failed: {exc}") from exc


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
