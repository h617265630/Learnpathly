"""Test step2: expand sections with sub-nodes."""
import time
import asyncio
import sys
import json
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(_PROJECT_ROOT / "gen_path"))

from dotenv import load_dotenv
load_dotenv(_PROJECT_ROOT / "gen_path" / ".env")

from gen_path.pipeline.step1_outline import run_step1
from gen_path.pipeline.step2_tutorial import run_step2


async def main():
    topic = "学习 AI Agent"
    print(f"Topic: {topic}\n")

    # Step 1: Generate outline
    print("Step 1: Generating outline...")
    step1_start = time.time()
    result = await run_step1(topic, level="intermediate", learning_depth="standard")
    step1_time = time.time() - step1_start
    print(f"  Step 1 completed in {step1_time:.2f}s")

    outline = result["outline"]
    print(f"  Sections: {len(outline.get('sections', []))}\n")

    # Step 2: Expand sections
    print("Step 2: Expanding sections with sub-nodes...")
    step2_start = time.time()
    expanded = await run_step2(outline, topic, level="intermediate")
    step2_time = time.time() - step2_start
    print(f"  Step 2 completed in {step2_time:.2f}s\n")

    # Print expanded outline
    print("=" * 60)
    print("EXPANDED OUTLINE")
    print("=" * 60)

    for section in expanded.get("sections", []):
        print(f"\n【{section.get('title', '')}】")
        print(f"   描述: {section.get('description', '')}")
        print(f"   预计时长: {section.get('estimated_minutes', 0)} 分钟")
        print(f"   子节点数: {len(section.get('learning_goals', []))}")

        for i, sub in enumerate(section.get("learning_goals", []), 1):
            print(f"\n   ├── [{i}] {sub.get('title', '')}")
            print(f"   │      {sub.get('description', '')}")
            kps = sub.get("key_points", [])
            if kps:
                print(f"   │      关键点: {', '.join(kps[:3])}")
            ex = sub.get("practical_exercise", "")
            if ex:
                print(f"   │      实践: {ex}")

    print(f"\n{'=' * 60}")
    print(f"Total time: {step1_time + step2_time:.2f}s")
    print(f"  - Step 1: {step1_time:.2f}s")
    print(f"  - Step 2: {step2_time:.2f}s")

    # Save result
    output_path = _PROJECT_ROOT / "result" / "ai_agent_expanded.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(expanded, f, ensure_ascii=False, indent=2)
    print(f"\nResult saved to: {output_path}")


if __name__ == "__main__":
    asyncio.run(main())