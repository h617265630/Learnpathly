#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx


RE_NUMBERED = re.compile(r"^\s*\d+\.\s+(?P<topic>.+?)\s*$")
RE_BULLET = re.compile(r"^\s*-\s+(?P<topic>.+?)\s*$")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _repo_root() -> Path:
    # backend/scripts/... -> backend -> repo root
    return Path(__file__).resolve().parents[2]


def parse_topics(md_path: Path) -> list[str]:
    if not md_path.exists():
        raise FileNotFoundError(f"topics file not found: {md_path}")

    topics: list[str] = []
    for raw in md_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        m = RE_NUMBERED.match(line) or RE_BULLET.match(line)
        if not m:
            continue
        topic = m.group("topic").strip()
        if topic:
            topics.append(topic)
    return topics


def slugify_for_filename(text: str, max_len: int = 48) -> str:
    # Keep ASCII alnum, turn spaces to -, drop everything else.
    s = text.lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9\-]+", "", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    if not s:
        return ""
    return s[:max_len].strip("-")


def topic_output_path(out_dir: Path, index_1based: int, topic: str) -> Path:
    slug = slugify_for_filename(topic)
    if not slug:
        digest = hashlib.md5(topic.encode("utf-8")).hexdigest()[:10]
        slug = f"topic-{digest}"
    return out_dir / f"{index_1based:03d}_{slug}.json"


def write_json(path: Path, payload: dict[str, Any]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def post_json(client: httpx.Client, url: str, payload: dict[str, Any]) -> dict[str, Any]:
    r = client.post(url, json=payload)
    r.raise_for_status()
    return r.json()


def get_json(client: httpx.Client, url: str) -> dict[str, Any]:
    r = client.get(url)
    r.raise_for_status()
    return r.json()


def run_topic(
    *,
    client: httpx.Client,
    api_base: str,
    topic: str,
    level: str,
    detail_level: str,
    out_path: Path,
    skip_if_exists: bool,
    sleep_s: float,
) -> dict[str, Any]:
    if skip_if_exists and out_path.exists():
        return {
            "topic": topic,
            "status": "skipped",
            "reason": "output file already exists",
            "out_path": str(out_path),
        }

    result: dict[str, Any] = {
        "topic": topic,
        "status": "started",
        "api_base": api_base,
        "started_at": _utc_now_iso(),
        "project_id": None,
        "outline_response": None,
        "project_before_details": None,
        "subnode_details": {},  # subnode_id(str) -> detail response
        "errors": [],
        "finished_at": None,
    }
    write_json(out_path, result)

    # Step 1: Outline (persists outline + subnodes)
    outline_payload: dict[str, Any] = {
        "query": topic,
        "level": level,
    }
    outline = post_json(client, f"{api_base}/ai-path/generate-outline", outline_payload)
    project_id = outline.get("project_id")
    if not project_id:
        raise RuntimeError(f"generate-outline did not return project_id for topic={topic!r}: {outline}")

    result["outline_response"] = outline
    result["project_id"] = project_id
    write_json(out_path, result)

    # Load project from DB to get section/subnode IDs
    project = get_json(client, f"{api_base}/ai-path/projects/{project_id}")
    result["project_before_details"] = project
    write_json(out_path, result)

    data = project.get("data") or {}
    if not isinstance(data, dict):
        raise RuntimeError(f"unexpected project.data shape for project_id={project_id}: {type(data)}")
    nodes = data.get("nodes") or []
    if not isinstance(nodes, list):
        raise RuntimeError(f"unexpected project nodes shape for project_id={project_id}: {type(nodes)}")

    # Step 2.5: Generate detail for each subnode (persists to DB)
    for node in nodes:
        if not isinstance(node, dict):
            continue
        section_title = str(node.get("title") or "")
        sub_nodes = node.get("sub_nodes") or []
        if not isinstance(sub_nodes, list):
            continue
        for sub in sub_nodes:
            if not isinstance(sub, dict):
                continue
            subnode_id = sub.get("id")
            subnode_title = str(sub.get("title") or "")
            subnode_desc = str(sub.get("description") or "")
            key_points = sub.get("learning_points") or []
            if not isinstance(key_points, list):
                key_points = []

            if not subnode_id:
                result["errors"].append(
                    {
                        "step": "subnode-detail",
                        "section_title": section_title,
                        "subnode_title": subnode_title,
                        "error": "missing subnode_id in project response",
                    }
                )
                write_json(out_path, result)
                continue

            # If details already exist in DB response, skip generating.
            existing_details = sub.get("details") or []
            if isinstance(existing_details, list):
                already = any(
                    isinstance(d, dict)
                    and d.get("detail_level") == detail_level
                    and (d.get("detailed_content") or "")
                    for d in existing_details
                )
                if already:
                    continue

            detail_payload: dict[str, Any] = {
                "subnode_id": int(subnode_id),
                "topic": topic,
                "section_title": section_title,
                "subnode_title": subnode_title,
                "subnode_description": subnode_desc,
                "subnode_key_points": [str(x) for x in key_points if str(x).strip()],
                "level": level,
                "detail_level": detail_level,
            }

            try:
                detail = post_json(client, f"{api_base}/ai-path/subnode-detail", detail_payload)
                result["subnode_details"][str(subnode_id)] = detail
                write_json(out_path, result)
            except Exception as exc:
                result["errors"].append(
                    {
                        "step": "subnode-detail",
                        "section_title": section_title,
                        "subnode_id": subnode_id,
                        "subnode_title": subnode_title,
                        "error": str(exc),
                    }
                )
                write_json(out_path, result)

            if sleep_s > 0:
                time.sleep(sleep_s)

    # Reload project to capture persisted details
    project_after = get_json(client, f"{api_base}/ai-path/projects/{project_id}")
    result["project_after_details"] = project_after
    result["status"] = "done"
    result["finished_at"] = _utc_now_iso()
    write_json(out_path, result)
    return result


def main(argv: list[str]) -> int:
    root = _repo_root()
    default_topics = root / "pathtopic.md"
    default_out_dir = root / "result" / "ai_path_batch"

    ap = argparse.ArgumentParser(
        description="Batch-generate AI Path outlines + subnode details from pathtopic.md, persist to DB, and save per-topic JSON files."
    )
    ap.add_argument("--api-base", default=os.environ.get("LEARNPATHLY_API_BASE", "http://127.0.0.1:8000"))
    ap.add_argument("--topics-file", type=Path, default=default_topics)
    ap.add_argument("--out-dir", type=Path, default=default_out_dir)
    ap.add_argument("--start", type=int, default=1, help="1-based start index (inclusive)")
    ap.add_argument("--end", type=int, default=0, help="1-based end index (inclusive), 0 = no limit")
    ap.add_argument("--level", default="intermediate")
    ap.add_argument("--detail-level", default="detailed", help="concise | detailed")
    ap.add_argument("--skip-existing", action="store_true")
    ap.add_argument("--sleep-s", type=float, default=0.0, help="sleep between subnode detail calls (seconds)")
    ap.add_argument("--timeout-s", type=float, default=300.0, help="per-request timeout seconds")
    args = ap.parse_args(argv)

    topics = parse_topics(args.topics_file)
    if not topics:
        print(f"No topics found in {args.topics_file}", file=sys.stderr)
        return 2

    start = max(1, int(args.start))
    end = int(args.end)
    if end and end < start:
        print("--end must be >= --start", file=sys.stderr)
        return 2

    args.out_dir.mkdir(parents=True, exist_ok=True)

    timeout = httpx.Timeout(args.timeout_s)
    limits = httpx.Limits(max_connections=5, max_keepalive_connections=5)

    print(f"API base: {args.api_base}")
    print(f"Topics file: {args.topics_file}")
    print(f"Out dir: {args.out_dir}")
    print(f"Topics: {len(topics)}")
    print(f"Range: {start}..{end or len(topics)}")

    failures = 0

    with httpx.Client(timeout=timeout, limits=limits) as client:
        # Basic health check
        try:
            health = get_json(client, f"{args.api_base}/health")
            if not isinstance(health, dict) or health.get("status") != "ok":
                print(f"Warning: unexpected /health response: {health}", file=sys.stderr)
        except Exception as exc:
            print(f"Cannot reach backend at {args.api_base}: {exc}", file=sys.stderr)
            return 3

        for idx_0, topic in enumerate(topics, start=1):
            if idx_0 < start:
                continue
            if end and idx_0 > end:
                break

            out_path = topic_output_path(args.out_dir, idx_0, topic)
            print(f"[{idx_0:03d}/{len(topics):03d}] {topic} -> {out_path.name}")
            try:
                run_topic(
                    client=client,
                    api_base=args.api_base.rstrip("/"),
                    topic=topic,
                    level=args.level,
                    detail_level=args.detail_level,
                    out_path=out_path,
                    skip_if_exists=bool(args.skip_existing),
                    sleep_s=float(args.sleep_s),
                )
            except Exception as exc:
                failures += 1
                err_path = out_path.with_suffix(".error.json")
                write_json(
                    err_path,
                    {
                        "topic": topic,
                        "status": "failed",
                        "error": str(exc),
                        "failed_at": _utc_now_iso(),
                        "api_base": args.api_base,
                    },
                )
                print(f"  FAILED: {exc}", file=sys.stderr)

    if failures:
        print(f"Done with failures: {failures}", file=sys.stderr)
        return 1
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
