"""
Test AI Path pipeline with "java全栈" topic.
"""
import asyncio
import json
from datetime import datetime
from ai_path.pipeline import run_workflow


async def main():
    topic = "java全栈"
    print(f"\n{'='*60}")
    print(f"开始生成学习路径: {topic}")
    print(f"{'='*60}\n")

    # Run the workflow
    result = await run_workflow(
        topic=topic,
        level="intermediate",
        learning_depth="standard",
        content_type="mixed",
        practical_ratio="balanced",
        resource_count="standard",
    )

    # Save to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"result/java_fullstack_{timestamp}.json"

    # Convert to dict for JSON serialization
    output = {
        "topic": topic,
        "timestamp": timestamp,
        "outline": result["outline"].model_dump() if hasattr(result["outline"], "model_dump") else result["outline"],
        "expanded_outline": result["expanded_outline"].model_dump() if hasattr(result["expanded_outline"], "model_dump") else result["expanded_outline"],
        "sections": result["sections"],
        "final_summary": result["final_summary"],
        "github_projects": result["github_projects"],
        "exclude_urls": result["exclude_urls"],
    }

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"✅ 学习路径生成完成!")
    print(f"{'='*60}")
    print(f"📁 保存至: {filename}")
    print(f"📊 章节数: {len(result['sections'])}")
    print(f"🔗 GitHub 项目: {len(result['github_projects'])} 个")
    print(f"\n📝 大纲预览:")
    print("-" * 40)

    outline = result["outline"]
    if hasattr(outline, "sections"):
        for i, section in enumerate(outline.sections, 1):
            print(f"  {i}. {section.title}")
    else:
        for i, section in enumerate(outline.get("sections", []), 1):
            print(f"  {i}. {section.get('title', 'N/A')}")

    print(f"\n{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
