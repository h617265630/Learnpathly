"""
Test the new 4-step pipeline.
"""

import asyncio
import time
import sys
from pathlib import Path

# Setup path
_PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(_PROJECT_ROOT))

# Load .env
from dotenv import load_dotenv
_env_path = _PROJECT_ROOT / "ai_path" / ".env"
load_dotenv(_env_path)

import os
print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER', 'minimax')}")


async def test_step1():
    """Test Step 1 independently."""
    from ai_path.pipeline import run_step1

    print("\n" + "="*60)
    print("Testing Step 1: Generate Outline")
    print("="*60)

    start = time.time()
    result = await run_step1(
        topic="LLM 大模型",
        level="intermediate",
        learning_depth="standard",
        content_type="mixed",
        practical_ratio="balanced",
    )
    elapsed = time.time() - start

    print(f"\n✅ Step 1 completed in {elapsed:.2f}s")
    print(f"Outline topic: {result['outline'].topic}")
    print(f"Outline overview: {result['outline'].overview[:100]}...")
    print(f"Number of sections: {len(result['outline'].sections)}")
    print(f"Discovered URLs: {len(result['discovered_urls'])}")

    return result


async def test_step2(step1_result):
    """Test Step 2 independently."""
    from ai_path.pipeline import run_step2

    print("\n" + "="*60)
    print("Testing Step 2: Expand Sections")
    print("="*60)

    start = time.time()
    result = await run_step2(
        outline=step1_result["outline"],
        topic="LLM 大模型",
        level="intermediate",
    )
    elapsed = time.time() - start

    print(f"\n✅ Step 2 completed in {elapsed:.2f}s")
    print(f"Number of sections: {len(result['sections'])}")

    # Show sub-nodes of first section
    if result['sections']:
        first = result['sections'][0]
        print(f"First section: {first.get('title', 'N/A')}")
        sub_nodes = first.get('sub_nodes', [])
        print(f"  Sub-nodes: {len(sub_nodes)}")
        if sub_nodes:
            print(f"  First sub-node: {sub_nodes[0].get('title', 'N/A')}")

    return result


async def test_step3(step2_result):
    """Test Step 3 independently."""
    from ai_path.pipeline import run_step3

    print("\n" + "="*60)
    print("Testing Step 3: Add Resources")
    print("="*60)

    start = time.time()
    result = await run_step3(
        sections=step2_result["sections"],
        topic="LLM 大模型",
        exclude_urls=[],
    )
    elapsed = time.time() - start

    print(f"\n✅ Step 3 completed in {elapsed:.2f}s")
    print(f"Number of sections: {len(result['sections'])}")

    # Count resources
    total_resources = 0
    for sec in result['sections']:
        resources = sec.get('resources', [])
        total_resources += len(resources)
    print(f"Total resources added: {total_resources}")

    return result


async def test_step4(step3_result):
    """Test Step 4 independently."""
    from ai_path.pipeline import run_step4

    print("\n" + "="*60)
    print("Testing Step 4: Generate Summary")
    print("="*60)

    start = time.time()
    result = await run_step4(
        topic="LLM 大模型",
        sections=step3_result["sections"],
        level="intermediate",
    )
    elapsed = time.time() - start

    print(f"\n✅ Step 4 completed in {elapsed:.2f}s")
    print(f"Summary length: {len(result['summary'])} chars")
    print(f"GitHub projects: {len(result['github_projects'])}")

    return result


async def test_full_workflow():
    """Test the complete workflow."""
    from ai_path.pipeline import run_workflow

    print("\n" + "="*60)
    print("Testing Full Workflow (run_workflow)")
    print("="*60)

    start = time.time()
    result = await run_workflow(
        topic="LLM 大模型",
        level="intermediate",
        learning_depth="standard",
        content_type="mixed",
        practical_ratio="balanced",
    )
    elapsed = time.time() - start

    print(f"\n✅ Full workflow completed in {elapsed:.2f}s")
    print(f"Outline topic: {result['outline'].topic}")
    print(f"Number of sections: {len(result['outline'].sections)}")
    print(f"Final summary length: {len(result['final_summary'])} chars")
    print(f"GitHub projects: {len(result['github_projects'])}")

    return result


async def main():
    print("Testing new 4-step pipeline structure")
    print(f"Project root: {_PROJECT_ROOT}")

    # Test each step independently
    step1_result = await test_step1()
    step2_result = await test_step2(step1_result)
    step3_result = await test_step3(step2_result)
    step4_result = await test_step4(step3_result)

    # Test full workflow
    await test_full_workflow()

    print("\n" + "="*60)
    print("All tests passed!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
