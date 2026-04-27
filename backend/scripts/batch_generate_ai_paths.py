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
RE_CJK = re.compile(r"[\u4e00-\u9fff]")
RE_LATIN = re.compile(r"[A-Za-z]")


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

def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def post_json(client: httpx.Client, url: str, payload: dict[str, Any]) -> dict[str, Any]:
    r = client.post(url, json=payload)
    r.raise_for_status()
    return r.json()


def get_json(client: httpx.Client, url: str) -> dict[str, Any]:
    r = client.get(url)
    r.raise_for_status()
    return r.json()

def _sleep_backoff_s(base_s: float, attempt: int) -> float:
    return base_s * (2 ** attempt)


def post_json_with_retry(
    client: httpx.Client,
    url: str,
    payload: dict[str, Any],
    *,
    retries: int,
    retry_sleep_s: float,
) -> dict[str, Any]:
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return post_json(client, url, payload)
        except (httpx.TimeoutException, httpx.ReadTimeout, httpx.ConnectTimeout) as exc:
            last_exc = exc
        except httpx.HTTPStatusError as exc:
            # Retry on 5xx only.
            status = exc.response.status_code if exc.response is not None else 0
            if status < 500:
                raise
            last_exc = exc

        if attempt >= retries:
            break
        time.sleep(_sleep_backoff_s(retry_sleep_s, attempt))

    assert last_exc is not None
    raise last_exc


def ensure_result_skeleton(topic: str, api_base: str, existing: dict[str, Any] | None = None) -> dict[str, Any]:
    if existing is None:
        existing = {}
    result: dict[str, Any] = dict(existing)
    result.setdefault("topic", topic)
    result.setdefault("status", "started")
    result.setdefault("api_base", api_base)
    result.setdefault("started_at", _utc_now_iso())
    result.setdefault("project_id", None)
    result.setdefault("outline_response", None)
    result.setdefault("project_before_details", None)
    result.setdefault("subnode_details", {})
    result.setdefault("errors", [])
    result.setdefault("finished_at", None)
    return result


def generate_missing_subnode_details(
    *,
    client: httpx.Client,
    api_base: str,
    project_id: int,
    topic: str,
    level: str,
    detail_level: str,
    out_path: Path,
    result: dict[str, Any],
    sleep_s: float,
    retries: int,
    retry_sleep_s: float,
) -> None:
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

            # If this subnode was already generated in this run/resume, skip.
            if str(subnode_id) in (result.get("subnode_details") or {}):
                continue

            # If details already exist in DB response, skip generating.
            existing_details = sub.get("details") or []
            if isinstance(existing_details, list):
                # Want English if topic is English (or subnode title is English).
                want_english = (not RE_CJK.search(topic)) and bool(RE_LATIN.search(topic))
                if not want_english and (not RE_CJK.search(subnode_title)) and bool(RE_LATIN.search(subnode_title)):
                    want_english = True

                def _detail_is_english(text: str) -> bool:
                    s = (text or "").strip()
                    if not s:
                        return False
                    if RE_CJK.search(s):
                        return False
                    return bool(RE_LATIN.search(s))

                for d in existing_details:
                    if not isinstance(d, dict):
                        continue
                    if d.get("detail_level") != detail_level:
                        continue
                    content = str(d.get("detailed_content") or "").strip()
                    if not content:
                        continue
                    # Skip only when it matches the desired language.
                    if not want_english or _detail_is_english(content):
                        # Already have the right-language detail.
                        content = ""
                        break
                else:
                    content = None  # type: ignore[assignment]

                if content == "":
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
                detail = post_json_with_retry(
                    client,
                    f"{api_base}/ai-path/subnode-detail",
                    detail_payload,
                    retries=retries,
                    retry_sleep_s=retry_sleep_s,
                )
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
    resume: bool,
    retries: int,
    retry_sleep_s: float,
) -> dict[str, Any]:
    if skip_if_exists and out_path.exists() and not resume:
        return {
            "topic": topic,
            "status": "skipped",
            "reason": "output file already exists",
            "out_path": str(out_path),
        }

    existing: dict[str, Any] | None = None
    if resume and out_path.exists():
        try:
            existing = load_json(out_path)
        except Exception:
            existing = None

    result = ensure_result_skeleton(topic, api_base, existing)
    if resume and out_path.exists():
        result["status"] = "resumed"
    write_json(out_path, result)

    # Step 1: Outline (persists outline + subnodes)
    project_id = result.get("project_id")
    if not project_id:
        outline_payload: dict[str, Any] = {
            "query": topic,
            "level": level,
        }
        outline = post_json_with_retry(
            client,
            f"{api_base}/ai-path/generate-outline",
            outline_payload,
            retries=retries,
            retry_sleep_s=retry_sleep_s,
        )
        project_id = outline.get("project_id")
        if not project_id:
            raise RuntimeError(f"generate-outline did not return project_id for topic={topic!r}: {outline}")

        result["outline_response"] = outline
        result["project_id"] = project_id
        try:
            maybe_title = ((outline.get("data") or {}).get("title") or "")
            if isinstance(maybe_title, str) and maybe_title.strip():
                result["english_title"] = maybe_title.strip()
        except Exception:
            pass
        write_json(out_path, result)

    topic_for_detail = str(result.get("english_title") or topic).strip() or topic

    generate_missing_subnode_details(
        client=client,
        api_base=api_base,
        project_id=int(project_id),
        topic=topic_for_detail,
        level=level,
        detail_level=detail_level,
        out_path=out_path,
        result=result,
        sleep_s=sleep_s,
        retries=retries,
        retry_sleep_s=retry_sleep_s,
    )

    # Reload project to capture persisted details
    project_after = get_json(client, f"{api_base}/ai-path/projects/{int(project_id)}")
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
    ap.add_argument("--resume", action="store_true", help="resume generation from existing output files if present")
    ap.add_argument("--sleep-s", type=float, default=0.0, help="sleep between subnode detail calls (seconds)")
    ap.add_argument("--timeout-s", type=float, default=900.0, help="per-request read timeout seconds")
    ap.add_argument("--retries", type=int, default=2, help="retries for outline/detail calls on timeout/5xx")
    ap.add_argument("--retry-sleep-s", type=float, default=2.0, help="base sleep seconds between retries (exponential backoff)")
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

    timeout = httpx.Timeout(connect=10.0, read=args.timeout_s, write=10.0, pool=10.0)
    limits = httpx.Limits(max_connections=5, max_keepalive_connections=5)

    print(f"API base: {args.api_base}", flush=True)
    print(f"Topics file: {args.topics_file}", flush=True)
    print(f"Out dir: {args.out_dir}", flush=True)
    print(f"Topics: {len(topics)}", flush=True)
    print(f"Range: {start}..{end or len(topics)}", flush=True)

    failures = 0

    with httpx.Client(timeout=timeout, limits=limits) as client:
        # Basic health check
        try:
            health = get_json(client, f"{args.api_base}/health")
            if not isinstance(health, dict) or health.get("status") != "ok":
                print(f"Warning: unexpected /health response: {health}", file=sys.stderr, flush=True)
        except Exception as exc:
            print(f"Cannot reach backend at {args.api_base}: {exc}", file=sys.stderr, flush=True)
            return 3

        for idx_0, topic in enumerate(topics, start=1):
            if idx_0 < start:
                continue
            if end and idx_0 > end:
                break

            out_path = topic_output_path(args.out_dir, idx_0, topic)
            print(f"[{idx_0:03d}/{len(topics):03d}] {topic} -> {out_path.name}", flush=True)
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
                    resume=bool(args.resume),
                    retries=int(args.retries),
                    retry_sleep_s=float(args.retry_sleep_s),
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
                print(f"  FAILED: {exc}", file=sys.stderr, flush=True)

    if failures:
        print(f"Done with failures: {failures}", file=sys.stderr, flush=True)
        return 1
    print("Done.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
