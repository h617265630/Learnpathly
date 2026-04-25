"""Test gen_path step1 timing."""

import time
import asyncio
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(_PROJECT_ROOT / "gen_path"))

from dotenv import load_dotenv
load_dotenv(_PROJECT_ROOT / "gen_path" / ".env")

from gen_path.pipeline.step1_outline import run_step1


async def main():
    topic = "AI Agent 教程"

    print(f"Topic: {topic}")
    print(f"Model: {__import__('os').getenv('LLM_PROVIDER', 'unknown')}")
    print(f"MiniMax model: {__import__('os').getenv('MINIMAX_MODEL', 'unknown')}")
    print()

    stages = [
        ("generate_queries", None),
        ("search_web", None),
        ("fetch_pages", None),
        ("summarize_resources", None),
        ("organize_outline", None),
    ]

    start = time.time()

    # Manually run each stage to time them
    from gen_path.models.schemas import GenPathState
    from gen_path.pipeline.step1_outline import generate_queries, search_web, fetch_pages, summarize_resources, organize_outline

    state: GenPathState = {
        "topic": topic,
        "level": "intermediate",
        "learning_depth": "standard",
        "content_type": "mixed",
        "practical_ratio": "balanced",
        "exclude_urls": [],
        "current_step": 1,
    }

    t0 = time.time()
    state = await generate_queries(state)
    print(f"1. generate_queries: {time.time() - t0:.2f}s ({len(state.get('queries', []))} queries)")

    t0 = time.time()
    state = await search_web(state)
    print(f"2. search_web: {time.time() - t0:.2f}s ({len(state.get('search_results', []))} results)")

    t0 = time.time()
    state = await fetch_pages(state)
    print(f"3. fetch_pages: {time.time() - t0:.2f}s ({len(state.get('fetched_pages', []))} pages)")

    t0 = time.time()
    state = await summarize_resources(state)
    print(f"4. summarize_resources: {time.time() - t0:.2f}s ({len(state.get('summaries', []))} summaries)")

    t0 = time.time()
    state = await organize_outline(state)
    print(f"5. organize_outline: {time.time() - t0:.2f}s")

    total = time.time() - start
    print(f"\nTotal step1: {total:.2f}s")


if __name__ == "__main__":
    asyncio.run(main())