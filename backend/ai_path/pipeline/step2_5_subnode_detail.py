"""
Step 2.5: Generate detailed content for each sub-node.

When user clicks on a sub-node in the frontend, this step generates:
1. Detailed explanation (Markdown)
2. Code examples
3. Related resources

This is called on-demand (lazy loading) to save time.

Cache: Results are cached by (topic, section_title, subnode_title) to avoid regeneration.
"""

from __future__ import annotations
import asyncio
import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any

from ai_path.models.schemas import SubNode
from ai_path.utils.llm import get_llm, parse_json_response


# ── Cache directory ────────────────────────────────────────────────────────────

_CACHE_DIR = Path(__file__).resolve().parent.parent / "result" / "subnode_cache"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)

_RE_CJK = re.compile(r"[\u4e00-\u9fff]")
_RE_LATIN = re.compile(r"[A-Za-z]")


def _looks_english_text(text: str) -> bool:
    s = (text or "").strip()
    if not s:
        return False
    if _RE_CJK.search(s):
        return False
    return bool(_RE_LATIN.search(s))


def _wants_english(topic: str, subnode_title: str) -> bool:
    return _looks_english_text(topic) or _looks_english_text(subnode_title)


def _infer_code_language(code: str) -> str:
    lowered = (code or "").lower()
    if any(token in code for token in ("public class ", "System.out.", "import java.", "private ", "extends ")):
        return "java"
    if any(token in code for token in ("interface ", ": string", ": number", "React.", "tsx")):
        return "typescript"
    if any(token in code for token in ("function ", "const ", "let ", "=>", "module.exports", "require(")):
        return "javascript"
    if any(token in code for token in ("def ", "import pandas", "print(", "if __name__")):
        return "python"
    if any(token in lowered for token in ("select ", " from ", " where ", "insert into", "create table")):
        return "sql"
    if any(token in code for token in ("#!/bin/bash", "npm ", "git ", "curl ")):
        return "bash"
    return "text"


def _normalize_structured_content(
    parsed: dict[str, Any],
    *,
    title: str,
    description: str,
    key_points: list[str],
    code_examples: list[Any],
) -> dict[str, Any]:
    practice = parsed.get("practice")
    if not isinstance(practice, dict):
        practice = {
            "title": f"Practice {title}",
            "description": parsed.get("practical_exercise")
            or f"Create a small artifact that demonstrates {title}.",
            "expected_output": "A short note, command log, screenshot, or working code snippet.",
        }

    normalized_examples: list[dict[str, str]] = []
    for i, item in enumerate(code_examples, 1):
        if isinstance(item, dict):
            code = str(item.get("code") or "").strip()
            if not code:
                continue
            language = str(item.get("language") or _infer_code_language(code))
            normalized_examples.append(
                {
                    "language": language,
                    "filename": str(item.get("filename") or f"example-{i}"),
                    "description": str(item.get("description") or f"Example {i}"),
                    "code": code,
                }
            )
        else:
            code = str(item or "").strip()
            if not code:
                continue
            normalized_examples.append(
                {
                    "language": _infer_code_language(code),
                    "filename": f"example-{i}",
                    "description": f"Example {i}",
                    "code": code,
                }
            )

    return {
        "title": str(parsed.get("title") or title),
        "summary": str(parsed.get("summary") or description),
        "concept": str(parsed.get("concept") or parsed.get("detailed_content") or description),
        "steps": parsed.get("steps") if isinstance(parsed.get("steps"), list) else key_points,
        "code_examples": normalized_examples,
        "common_mistakes": parsed.get("common_mistakes")
        if isinstance(parsed.get("common_mistakes"), list)
        else [],
        "best_practices": parsed.get("best_practices")
        if isinstance(parsed.get("best_practices"), list)
        else [],
        "practice": practice,
        "summary_points": parsed.get("summary_points")
        if isinstance(parsed.get("summary_points"), list)
        else key_points[:3],
        "visuals": parsed.get("visuals") if isinstance(parsed.get("visuals"), list) else [],
        "resources": parsed.get("resources") if isinstance(parsed.get("resources"), list) else [],
    }


def _get_cache_key(topic: str, section_title: str, subnode_title: str, detail_level: str = "detailed") -> str:
    """Generate cache key from topic + section + subnode + detail_level."""
    key_str = f"{topic}|{section_title}|{subnode_title}|{detail_level}"
    return hashlib.md5(key_str.encode()).hexdigest()


def _get_cache_path(cache_key: str) -> Path:
    """Get cache file path."""
    return _CACHE_DIR / f"{cache_key}.json"


def _load_from_cache(cache_key: str) -> SubNode | None:
    """Load cached result if exists."""
    cache_path = _get_cache_path(cache_key)
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return SubNode(**data)
        except Exception:
            pass
    return None


def _save_to_cache(cache_key: str, subnode: SubNode) -> None:
    """Save result to cache."""
    cache_path = _get_cache_path(cache_key)
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(subnode.model_dump(), f, ensure_ascii=False, indent=2)
    except Exception:
        pass


async def generate_subnode_detail(
    subnode_title: str,
    subnode_description: str,
    subnode_key_points: list[str],
    section_title: str,
    topic: str,
    level: str = "intermediate",
    detail_level: str = "detailed",
) -> SubNode:
    """
    Generate detailed content for a single sub-node.

    Args:
        detail_level: "concise" (30-60s) or "detailed" (2min)

    Returns SubNode with detailed_content, code_examples filled.
    """
    key_points_text = "\n".join([f"- {kp}" for kp in subnode_key_points])

    # Concise prompt (30-60 seconds)
    if detail_level == "concise":
        prompt = f"""You are a technical educator. Generate a concise explanation for the following knowledge point.

## Context
- Topic: {topic}
- Knowledge point: {subnode_title}
- Summary: {subnode_description}
- Level: {level}

## Provided key points
{key_points_text}

## Task
Generate a concise explanation (<= 200 words) including:
1. A short concept explanation
2. One short runnable code example
3. 3 core takeaways

Return JSON only (no markdown code fences):
{{
  "detailed_content": "Concise Markdown explanation",
  "code_examples": ["One short runnable code example"]
}}

Requirements: write everything in English, be clear and to-the-point."""
    else:
        # Detailed prompt (2 minutes)
        prompt = f"""You are a professional technical educator. Generate a detailed explanation for the following knowledge point.

## Context
- Topic: {topic}
- Chapter: {section_title}
- Knowledge point: {subnode_title}
- Summary: {subnode_description}
- Level: {level}

## Provided key points
{key_points_text}

## Task
Generate detailed content including:
1. Concept explanation (why it matters)
2. Core mechanics (how it works)
3. Runnable code examples
4. Common pitfalls and gotchas
5. Practical advice

Return JSON only (no markdown code fences):
{{
  "title": "{subnode_title}",
  "summary": "One sentence describing what the learner can do after this lesson",
  "concept": "Core concept explanation",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "detailed_content": "Detailed Markdown explanation (with headings, paragraphs, lists, etc.)",
  "code_examples": [
    {{
      "language": "bash|python|javascript|typescript|json|yaml|sql|text",
      "filename": "example filename when useful",
      "description": "What this example demonstrates",
      "code": "Runnable code only, no markdown fences"
    }}
  ],
  "common_mistakes": ["Common mistake 1", "Common mistake 2"],
  "best_practices": ["Best practice 1", "Best practice 2"],
  "practice": {{
    "title": "Small practical task",
    "description": "What the learner should build or try",
    "expected_output": "What artifact proves completion"
  }},
  "summary_points": ["Short takeaway 1", "Short takeaway 2"],
  "visuals": [
    {{
      "type": "flowchart",
      "title": "Optional simple flow",
      "description": "What the flow explains",
      "mermaid": "flowchart TD..."
    }}
  ],
  "resources": []
}}

Requirements:
- Write everything in English.
- detailed_content should be detailed and easy to understand, in Markdown.
- code_examples must be an array of objects and every code field must be runnable/copy-pasteable code without markdown fences.
- Tailor the content for {level} learners."""

    try:
        llm = get_llm(temperature=0.3)
        timeout_s = float(os.getenv("AI_PATH_DETAIL_LLM_TIMEOUT_S", "150") or 150)
        response = await asyncio.wait_for(llm.ainvoke(prompt), timeout=timeout_s)
        parsed = parse_json_response(response.content)

        detailed_content = parsed.get("detailed_content", "")
        raw_code_examples = parsed.get("code_examples", [])
        if not isinstance(raw_code_examples, list):
            raw_code_examples = []
        structured_content = _normalize_structured_content(
            parsed,
            title=subnode_title,
            description=subnode_description,
            key_points=subnode_key_points,
            code_examples=raw_code_examples,
        )
        code_examples = [
            str(item.get("code") or "").strip()
            for item in structured_content.get("code_examples", [])
            if isinstance(item, dict) and str(item.get("code") or "").strip()
        ]

        # Enhance detailed_content with code examples
        if code_examples:
            code_section = "\n\n## Code Examples\n\n"
            for i, code in enumerate(code_examples, 1):
                language = _infer_code_language(str(code))
                code_section += f"### Example {i}\n\n```{language}\n{code}\n```\n\n"
            detailed_content += code_section

        # Add common mistakes and best practices
        if parsed.get("common_mistakes"):
            detailed_content += "\n\n## Common Mistakes\n\n"
            for mistake in parsed["common_mistakes"]:
                detailed_content += f"- {mistake}\n"

        if parsed.get("best_practices"):
            detailed_content += "\n\n## Best Practices\n\n"
            for practice in parsed["best_practices"]:
                detailed_content += f"- {practice}\n"

        return SubNode(
            title=subnode_title,
            description=subnode_description,
            key_points=subnode_key_points,
            detailed_content=detailed_content,
            code_examples=code_examples,
            structured_content=structured_content,
        )
    except Exception:
        # Fallback: return basic content
        return SubNode(
            title=subnode_title,
            description=subnode_description,
            key_points=subnode_key_points,
            detailed_content=f"# {subnode_title}\n\n{subnode_description}\n\n" +
                           "\n".join([f"- {kp}" for kp in subnode_key_points]),
            structured_content=_normalize_structured_content(
                {},
                title=subnode_title,
                description=subnode_description,
                key_points=subnode_key_points,
                code_examples=[],
            ),
        )


async def run_step2_5(
    subnode: SubNode | dict,
    section_title: str,
    topic: str,
    level: str = "intermediate",
    detail_level: str = "detailed",
) -> SubNode:
    """
    Step 2.5: Generate detailed content for a sub-node.

    Args:
        subnode: The sub-node to expand (SubNode object or dict)
        section_title: Parent section title
        topic: Main learning topic
        level: Difficulty level
        detail_level: "concise" (30-60s) or "detailed" (2min)

    Returns:
        SubNode with detailed_content filled

    Cache: Results are cached by (topic, section_title, subnode_title, detail_level)
    """
    # Handle both SubNode object and dict
    if isinstance(subnode, SubNode):
        subnode_title = subnode.title
        subnode_description = subnode.description
        subnode_key_points = subnode.key_points
    else:
        subnode_title = subnode.get("title", "")
        subnode_description = subnode.get("description", "")
        subnode_key_points = subnode.get("key_points", [])

    # Check cache first
    cache_key = _get_cache_key(topic, section_title, subnode_title, detail_level)
    cached_result = _load_from_cache(cache_key)
    if cached_result:
        if _wants_english(topic, subnode_title) and not _looks_english_text(cached_result.detailed_content or ""):
            cached_result = None
        else:
            return cached_result

    # Generate new content
    result = await generate_subnode_detail(
        subnode_title=subnode_title,
        subnode_description=subnode_description,
        subnode_key_points=subnode_key_points,
        section_title=section_title,
        topic=topic,
        level=level,
        detail_level=detail_level,
    )

    # Save to cache
    _save_to_cache(cache_key, result)

    return result
