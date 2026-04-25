import request from "./request";

export interface AiPathResourceLink {
  url: string;
}

export interface AiPathSubNode {
  title: string;
  description: string;
  learning_points?: string[];
  resources?: AiPathResourceLink[];
}

export interface AiPathNode {
  title: string;
  description: string;
  explanation?: string;
  tutorial?: string[];
  resources?: AiPathResourceLink[];
  sub_nodes?: AiPathSubNode[];
  order?: number;
}

export interface AiPathData {
  title: string;
  summary: string;
  description?: string;
  recommendations?: string[];
  nodes: AiPathNode[];
}

export interface AiPathGenerateResponse {
  data: AiPathData;
  warnings: string[];
}

export interface AiPathPreferences {
  level?: "beginner" | "intermediate" | "advanced";
  learning_depth?: "quick" | "standard" | "deep";
  content_type?: "video" | "article" | "mixed";
  practical_ratio?: "theory_first" | "balanced" | "practice_first";
}

export function generateAiPath(query: string, preferences?: AiPathPreferences) {
  return request.post<AiPathGenerateResponse, AiPathGenerateResponse>(
    "/ai-path/generate",
    { query, ...preferences },
    {
      timeout: 120000,
    }
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
