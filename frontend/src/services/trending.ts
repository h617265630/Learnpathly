import request from "./request";

export interface TrendingItem {
  id: string | number;
  title: string;
  summary: string;
  source_url: string;
  thumbnail: string;
  platform: string;
  resource_type: string;
  category_name: string;
  stats: {
    stars?: number;
    forks?: number;
    watchers?: number;
    language?: string;
    topics?: string[];
    views?: number;
    likes?: number;
    comments?: number;
    duration?: string;
    channel?: string;
  };
  created_at?: string;
  updated_at?: string;
  popularity_score?: number;
}

export interface TrendingResponse {
  total_count: number;
  items: TrendingItem[];
}

export interface CombinedTrendingResponse {
  total_count: number;
  items: TrendingItem[];
  sources: {
    github: {
      count: number;
      error: string | null;
    };
    youtube: {
      count: number;
      error: string | null;
    };
  };
}

export function getGitHubTrending(params?: {
  language?: string;
  since?: "daily" | "weekly" | "monthly";
  per_page?: number;
}): Promise<TrendingResponse> {
  return request.get("/trending/github", { params });
}

export function getYouTubeTrending(params: {
  api_key: string;
  region_code?: string;
  category_id?: string;
  max_results?: number;
}): Promise<TrendingResponse> {
  return request.get("/trending/youtube", { params });
}

export function getCombinedTrending(params?: {
  youtube_api_key?: string;
  github_language?: string;
  github_per_page?: number;
  youtube_max_results?: number;
  youtube_region?: string;
  youtube_category?: string;
}): Promise<CombinedTrendingResponse> {
  return request.get("/trending/combined", { params });
}
