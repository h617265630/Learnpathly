"""
Test step1: generate_queries
Run this script to measure how long each pipeline stage takes.
"""

import asyncio
import time
import sys
from pathlib import Path

# Setup path - test_step1.py is in project root
_PROJECT_ROOT = Path(__file__).resolve().parent  # /Users/burn/Code/path
sys.path.insert(0, str(_PROJECT_ROOT))

# Load .env
from dotenv import load_dotenv
_env_path = _PROJECT_ROOT / "ai_path" / ".env"
print(f"Project root: {_PROJECT_ROOT}")
print(f"ai_path .env: {_PROJECT_ROOT / 'ai_path' / '.env'}")
print(f".env exists: {(_PROJECT_ROOT / 'ai_path' / '.env').exists()}")
load_dotenv(_env_path)

import os
print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
print(f"MINIMAX_MODEL: {os.getenv('MINIMAX_MODEL')}")
print(f"MINIMAX_API_KEY: {'set' if os.getenv('MINIMAX_API_KEY') else 'NOT SET'}")

from ai_path.models.schemas import PipelineState
from ai_path.pipeline.queries import generate_queries


async def main():
    topic = "AI Agent 教程"

    initial: PipelineState = {
        "topic": topic,
        "level": "beginner",
        "resource_count": "standard",
        "content_type": "mixed",
        "learning_depth": "standard",
        "practical_ratio": "balanced",
        "current_stage": "search",
        "exclude_urls": [],
    }

    print(f"Testing generate_queries for topic: {topic}")
    print(f"Model: {__import__('os').getenv('LLM_PROVIDER', 'minimax')}")
    print(f"MiniMax model: {__import__('os').getenv('MINIMAX_MODEL', 'unknown')}")
    print()

    start = time.time()
    result = await generate_queries(initial)
    elapsed = time.time() - start

    print(f"✅ Step 1 completed in {elapsed:.2f}s")
    print(f"Generated {len(result.get('queries', []))} queries:")
    for q in result.get('queries', []):
        print(f"  - {q.query[:60]} ({q.purpose})")


if __name__ == "__main__":
    asyncio.run(main())