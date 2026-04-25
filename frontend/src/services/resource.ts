import request from "./request";

export interface UrlExtractResponse {
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  author?: string | null;
  publish_date?: string | null;
  video_id?: string | null;
  duration_seconds?: number | null;
  platform?: string | null;
  chapters?: ChapterItem[];
}

export function extractVideoMetadata(url: string): Promise<UrlExtractResponse> {
  return request.post("/resources/extract", { url });
}

export interface DbResource {
  id: number;
  resource_type: string;
  platform: string;
  title: string;
  summary: string | null;
  source_url: string;
  thumbnail: string | null;
  category_id: number | null;
  difficulty: string | null;
  tags: object;
  created_at: string;
  updated_at: string;
  category_name?: string;
  is_system_public?: boolean;

  manual_weight?: number | null;
  behavior_weight?: number | null;
  effective_weight?: number | null;
  added_at?: string | null;
  last_opened?: string | null;
  open_count?: number | null;
  completion_status?: boolean | null;

  community_score?: number | null;
  save_count?: number | null;
  trending_score?: number | null;
  user_seq?: number | null;
  visibility?: string | null; // "private" | "public" - 决定是否进入公共池
  source?: string | null; // "created" | "saved"

  // 用户个性化字段
  custom_notes?: string | null;
  custom_tags?: Record<string, unknown> | null;
  personal_rating?: number | null;
  is_favorite?: boolean | null;
}

export interface ChapterItem {
  start_seconds: number;
  timestamp: string;
  title: string;
  description?: string | null;
}

export interface DbResourceDetail extends DbResource {
  video?: {
    duration?: number | null;
    channel?: string | null;
    video_id?: string | null;
  } | null;
  doc?: {
    doc_type?: string | null;
    version?: string | null;
  } | null;
  article?: {
    publisher?: string | null;
    published_at?: string | null;
  } | null;
}

export function listMyResources(): Promise<DbResource[]> {
  return request.get("/resources/me");
}

export function listResources(): Promise<DbResource[]> {
  return request.get("/resources");
}

export interface SearchResultItem {
  title: string;
  url: string;
  description?: string | null;
  source_score?: number | null;
  type?: string | null;
  thumbnail?: string | null;
}

export function searchResources(
  q: string,
  platform: "github" | "youtube" | "all" = "github"
): Promise<{ results: SearchResultItem[]; platform: string }> {
  return request.get("/resources/search", { params: { q, platform } });
}

export function createMyResourceFromUrl(
  url: string,
  payload?: { category_id?: number | null; is_public?: boolean; manual_weight?: number }
): Promise<DbResource> {
  return request.post("/resources/me", { url, ...(payload || {}) });
}

export function addPublicResourceToMyResources(
  resourceId: number
): Promise<DbResource> {
  return request.post(`/resources/me/${resourceId}`, {});
}

export type AddToMyResourcesResult = {
  already_exists: boolean;
  resource: DbResource;
};

export function addPublicResourceToMyResourcesWithStatus(
  resourceId: number
): Promise<AddToMyResourcesResult> {
  return request.post(`/resources/me/${resourceId}/attach`, {});
}

export function addPublicResourceToMyResourcesWithStatusAndWeight(
  resourceId: number,
  payload?: { manual_weight?: number }
): Promise<AddToMyResourcesResult> {
  return request.post(`/resources/me/${resourceId}/attach`, payload || {});
}

export function deleteMyResource(resourceId: number) {
  return request.delete(`/resources/me/${resourceId}`);
}

export function deleteResource(resourceId: number) {
  return request.delete(`/resources/${resourceId}`);
}

export function updateMyResource(
  resourceId: number,
  payload: {
    title?: string;
    summary?: string | null;
    platform?: string | null;
    thumbnail?: string | null;
    difficulty?: number | null;
    tags?: Record<string, unknown> | null;
    raw_meta?: Record<string, unknown> | null;
    manual_weight?: number | null;
    is_public?: boolean;
  }
): Promise<DbResource> {
  return request.patch(`/resources/me/${resourceId}`, payload);
}

export function getMyResourceDetail(
  resourceId: number
): Promise<DbResourceDetail> {
  return request.get(`/resources/me/${resourceId}`);
}

export function getResourceDetail(
  resourceId: number
): Promise<DbResourceDetail> {
  return request.get(`/resources/${resourceId}`);
}

export type UserResourceProfilePayload = {
  category_id?: number | null;
  custom_notes?: string | null;
  custom_tags?: Record<string, unknown> | null;
  personal_rating?: number | null;
  is_favorite?: boolean | null;
};

export function updateUserResourceProfile(
  resourceId: number,
  payload: UserResourceProfilePayload
): Promise<DbResource> {
  return request.patch(`/resources/me/${resourceId}/profile`, payload);
}
