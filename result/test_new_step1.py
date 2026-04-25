"""Test new simplified step1."""
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
    topic = "学习 AI Agent"

    print(f"Topic: {topic}")
    print(f"Model: {__import__('os').getenv('LLM_PROVIDER', 'unknown')}")
    print()

    start = time.time()
    result = await run_step1(topic, level="intermediate", learning_depth="standard")
    total = time.time() - start

    print(f"\n✅ Step 1 completed in {total:.2f}s")
    print(f"\nOutline: {result['outline']['overview'] if result.get('outline') else 'N/A'}")
    sections = result.get('outline', {}).get('sections', [])
    print(f"Sections: {len(sections)}")
    for s in sections:
        print(f"  - {s.get('title')}")


if __name__ == "__main__":
    asyncio.run(main())