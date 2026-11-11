import request from "./request";

// ─────────────────────────────────────────────────────────────────────────────
// gen_path API client (`/gen-path`).
//
// The backend chain (outline → tutorial → resources → summary) was repaired in
// 2026-11 (`28e3ab7`, `f61edfb`) and is fully working, but the frontend had no
// client for it at all. This file is that missing client: a thin, typed wrapper
// over the seven routes.
//
// Every route requires a logged-in user (the router depends on
// `get_current_user`), so the token in request.ts is what makes these calls
// work — no per-call auth handling needed here.
//
// Endpoints (backend/app/api/gen_path/router.py):
//   POST   /gen-path/outline                    step 1 — create project + outline
//   POST   /gen-path/tutorial                   step 2 — per-section tutorial
//   POST   /gen-path/resources                  step 3 — per-section resources
//   POST   /gen-path/summary                    step 4 — final summary + GitHub projects
//   GET    /gen-path/projects/{project_id}      project + its sections
//   GET    /gen-path/projects?limit&offset      the caller's own projects only
//   DELETE /gen-path/projects/{project_id}      delete (404 for someone else's)
// ─────────────────────────────────────────────────────────────────────────────

export type GenPathLevel = "beginner" | "intermediate" | "advanced";
export type GenPathDepth = "quick" | "standard" | "deep";
export type GenPathContentType = "video" | "article" | "mixed";
export type GenPathPracticalRatio =
  | "theory_first"
  | "balanced"
  | "practice_first";

export interface GenPathCreateParams {
  topic: string;
  level?: GenPathLevel;
  learning_depth?: GenPathDepth;
  content_type?: GenPathContentType;
  practical_ratio?: GenPathPracticalRatio;
}

/** Row of `gen_path_projects` (see backend/app/models/gen_path.py). */
export interface GenPathProject {
  id: string;
  user_id?: number | null;
  topic: string;
  level: string;
  learning_depth: string;
  content_type: string;
  practical_ratio: string;
  outline_json?: Record<string, unknown> | null;
  final_summary?: string | null;
  github_projects_json?: unknown[] | null;
  /** step1 → step2 → step3 → step4 → done */
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Row of `gen_path_sections`. */
export interface GenPathSection {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  description?: string | null;
  learning_goals_json?: string[] | null;
  search_queries_json?: string[] | null;
  tutorial_md?: string | null;
  created_at?: string | null;
}

export interface GenPathOutlineResponse {
  project_id: string;
  outline: Record<string, unknown>;
  summaries: Record<string, unknown>[];
  all_urls: string[];
}

export interface GenPathProjectDetail {
  project: GenPathProject;
  sections: GenPathSection[];
}

export interface GenPathTutorialResponse {
  section_id: string;
  tutorial: string;
  key_points: string[];
  source_urls: string[];
}

export interface GenPathResourcesResponse {
  section_id: string;
  resources: Record<string, unknown>[];
}

export interface GenPathSummaryResponse {
  project_id: string;
  summary: string;
  github_projects: Record<string, unknown>[];
}

export interface GenPathProjectListResponse {
  projects: GenPathProject[];
  total: number;
}

// ── Step 1: outline ──────────────────────────────────────────────────────────

/**
 * Create a project and generate its learning-path outline.
 * This is the expensive call (web search + summarisation + LLM) — hence the
 * 5-minute timeout, same as the old ai-path client.
 */
export function createGenPathOutline(params: GenPathCreateParams) {
  return request.post<GenPathOutlineResponse, GenPathOutlineResponse>(
    "/gen-path/outline",
    {
      topic: params.topic,
      level: params.level ?? "intermediate",
      learning_depth: params.learning_depth ?? "standard",
      content_type: params.content_type ?? "mixed",
      practical_ratio: params.practical_ratio ?? "balanced",
    },
    { timeout: 300000 }
  );
}

// ── Step 2: tutorial for one section ─────────────────────────────────────────

export function generateGenPathTutorial(payload: {
  project_id: string;
  section_id: string;
  resource_urls?: string[];
}) {
  return request.post<GenPathTutorialResponse, GenPathTutorialResponse>(
    "/gen-path/tutorial",
    {
      project_id: payload.project_id,
      section_id: payload.section_id,
      resource_urls: payload.resource_urls ?? [],
    },
    { timeout: 300000 }
  );
}

// ── Step 3: resources for one section ───────────────────────────────────────

export function fetchGenPathResources(payload: {
  project_id: string;
  section_id: string;
  resource_type_filter?: string;
  max_results?: number;
}) {
  return request.post<GenPathResourcesResponse, GenPathResourcesResponse>(
    "/gen-path/resources",
    {
      project_id: payload.project_id,
      section_id: payload.section_id,
      resource_type_filter: payload.resource_type_filter ?? "all",
      max_results: payload.max_results ?? 6,
    },
    { timeout: 180000 }
  );
}

// ── Step 4: summary + GitHub projects ────────────────────────────────────────

export function generateGenPathSummary(projectId: string) {
  return request.post<GenPathSummaryResponse, GenPathSummaryResponse>(
    "/gen-path/summary",
    { project_id: projectId },
    { timeout: 300000 }
  );
}

// ── Read / delete ────────────────────────────────────────────────────────────

export function getGenPathProject(projectId: string) {
  return request.get<GenPathProjectDetail, GenPathProjectDetail>(
    `/gen-path/projects/${projectId}`
  );
}

/** Only the caller's own projects (the backend filters by user_id). */
export function listGenPathProjects(limit = 20, offset = 0) {
  return request.get<GenPathProjectListResponse, GenPathProjectListResponse>(
    `/gen-path/projects?limit=${limit}&offset=${offset}`
  );
}

/** Deletes the project; the backend answers 404 for somebody else's project. */
export function deleteGenPathProject(projectId: string) {
  return request.delete<{ success: boolean }, { success: boolean }>(
    `/gen-path/projects/${projectId}`
  );
}
