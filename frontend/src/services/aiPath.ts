import request from "./request";

export interface AiPathResourceLink {
  url: string;
  title?: string;
  description?: string;
  summary?: string;
  key_points?: string[];
  difficulty?: string;
  resource_type?: string;
  learning_stage?: string;
  estimated_minutes?: number;
  image?: string | null;
}

export interface AiPathSubNodeDetail {
  id: number;
  subnode_id: number;
  detail_level: string;
  detailed_content: string;
  code_examples?: string[];
  structured_content?: Record<string, unknown>;
  raw_json?: Record<string, unknown>;
}

export interface AiPathSubNode {
  id?: number;
  section_id?: number;
  title: string;
  description: string;
  learning_points?: string[];
  practical_exercise?: string;
  search_keywords?: string[];
  details?: AiPathSubNodeDetail[];
  resources?: AiPathResourceLink[];
}

export interface AiPathNode {
  id?: number;
  project_id?: number;
  title: string;
  description: string;
  explanation?: string;
  tutorial?: string[];
  resources?: AiPathResourceLink[];
  sub_nodes?: AiPathSubNode[];
  order?: number;
  estimated_minutes?: number;
}

export interface AiPathData {
  title: string;
  summary: string;
  description?: string;
  cover_image_url?: string | null;
  recommendations?: string[];
  nodes: AiPathNode[];
}

export interface AiPathGenerateResponse {
  project_id?: number | null;
  data: AiPathData;
  warnings: string[];
}

export interface AiPathProjectListItem {
  id: number;
  topic: string;
  outline_overview?: string;
  cover_image_url?: string | null;
  created_at?: string;
  total_subnodes?: number;
  completed_subnodes?: number;
  is_complete?: boolean;
}

export interface AiPathPreferences {
  level?: "beginner" | "intermediate" | "advanced";
  learning_depth?: "quick" | "standard" | "deep";
  content_type?: "video" | "article" | "mixed";
  practical_ratio?: "theory_first" | "balanced" | "practice_first";
}

export function generateAiPath(query: string, preferences?: AiPathPreferences) {
  return request.post<AiPathGenerateResponse, AiPathGenerateResponse>(
    "/ai-path/generate-outline",
    { query, ...preferences },
    {
      // Outline generation may take 2-3 minutes depending on the topic and provider.
      timeout: 300000,
    }
  );
}

export function generateAdminAiPath(query: string, preferences?: AiPathPreferences) {
  return request.post<AiPathGenerateResponse, AiPathGenerateResponse>(
    "/admin/ai-path/generate-outline",
    { query, ...preferences },
    {
      // Admin batch/content generation can take a few minutes depending on the provider.
      timeout: 300000,
    }
  );
}

export function getAiPathProject(projectId: number) {
  return request.get<AiPathGenerateResponse, AiPathGenerateResponse>(
    `/ai-path/projects/${projectId}`
  );
}

export function getAiPathProjectByLearningPathId(learningPathId: number) {
  return request.get<AiPathGenerateResponse, AiPathGenerateResponse>(
    `/ai-path/projects/by-learning-path/${learningPathId}`
  );
}

export function getLatestAiPathProject() {
  return request.get<AiPathGenerateResponse, AiPathGenerateResponse>(
    "/ai-path/projects/latest"
  );
}

export function listAiPathProjects(limit = 8, offset = 0) {
  return request.get<AiPathProjectListItem[], AiPathProjectListItem[]>(
    `/ai-path/projects?limit=${limit}&offset=${offset}`
  );
}

// ── AI Resource search ──────────────────────────────────────────────────────────

export interface AiResourceItem {
  url: string;
  title: string;
  description: string;
  key_points: string[];
  difficulty: string;
  resource_type: string;
  learning_stage: string;
  estimated_minutes: number;
  image?: string | null;
}

export interface AiResourceSearchResponse {
  data: AiResourceItem[];          // web / Tavily results
  github_results: AiResourceItem[]; // GitHub API results
  topic: string;
}

export interface CachedResultsResponse {
  data: AiResourceItem[];
  topic: string;
  cached_count: number;
}

export function searchAiResources(query: string, excludeUrls: string[] = []) {
  return request.post<AiResourceSearchResponse, AiResourceSearchResponse>(
    "/ai-path/search-resources",
    { query, exclude_urls: excludeUrls },
    { timeout: 60000 }
  );
}

export function getCachedResults(topic: string) {
  return request.get<CachedResultsResponse, CachedResultsResponse>(
    `/ai-path/cached-results/${encodeURIComponent(topic)}`
  );
}

// ── SubNode Detail (Step 2.5) ──────────────────────────────────────────────────────────

export interface SubNodeDetailRequest {
  subnode_id?: number;
  topic: string;
  section_title: string;
  subnode_title: string;
  subnode_description?: string;
  subnode_key_points?: string[];
  level?: string;
  detail_level?: string;
}

export interface SubNodeDetailResponse {
  detail_id?: number | null;
  subnode_id?: number | null;
  title: string;
  description: string;
  key_points: string[];
  detailed_content: string;
  code_examples: string[];
  structured_content?: Record<string, unknown>;
}

export function getSubNodeDetail(payload: SubNodeDetailRequest) {
  return request.post<SubNodeDetailResponse, SubNodeDetailResponse>(
    "/ai-path/subnode-detail",
    payload,
    { timeout: 180000 }
  );
}
