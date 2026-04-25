import request from "./request";
import type { DbResource } from "./resource";

export type PublicLearningPath = {
  id: number;
  title: string;
  type?: string | null;
  description?: string | null;
  is_public: boolean;
  is_active: boolean;
  cover_image_url?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  creator_id?: number | null;
  item_count?: number;
  // Fork lineage
  parent_id?: number | null;
  root_id?: number | null;
  status?: string | null;
  published_at?: string | null;
  fork_count?: number;
  like_count?: number;
  view_count?: number;
};

export type LearningPathDisplayBase = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  categoryName: string;
  itemCount: number;
  forkCount?: number;
  status?: string | null;
};

export function mapPublicLearningPathToDisplayBase(
  p: PublicLearningPath
): LearningPathDisplayBase {
  const id = String(p.id);
  const title = String(p.title || "").trim() || `Path ${id}`;
  const description = String(p.description || "").trim();
  const thumbnail = String(p.cover_image_url || "").trim();
  const categoryName = String(p.category_name || "").trim();
  const itemCount = Number((p as any).item_count ?? 0);
  const forkCount = typeof p.fork_count === "number" ? p.fork_count : undefined;
  const status = p.status ?? undefined;
  return {
    id,
    title,
    description,
    thumbnail,
    categoryName,
    itemCount,
    forkCount,
    status,
  };
}

export type PublicLearningPathDetail = PublicLearningPath & {
  path_items: Array<{
    id: number;
    learning_path_id: number;
    resource_id: number;
    resource_type: string;
    title: string;
    order_index: number;
    stage?: string | null;
    purpose?: string | null;
    estimated_time?: number | null;
    is_optional: boolean;
    manual_weight?: number | null;
    resource_data?: DbResource | null;
  }>;
};

export function listPublicLearningPaths(): Promise<PublicLearningPath[]> {
  return request.get("/learning-paths/public");
}

export function getPublicLearningPathDetail(
  id: number
): Promise<PublicLearningPathDetail> {
  return request.get(`/learning-paths/public/${id}`);
}

export function createLearningPath(payload: {
  title: string;
  type?: string | null;
  description?: string;
  is_public: boolean;
  cover_image_url?: string | null;
}): Promise<PublicLearningPath> {
  return request.post("/learning-paths/", payload);
}

export function createLearningPathWithCategory(payload: {
  title: string;
  type?: string | null;
  description?: string;
  is_public: boolean;
  cover_image_url?: string | null;
  category_id?: number | null;
}): Promise<PublicLearningPath> {
  return request.post("/learning-paths/", payload);
}

export type MyLearningPath = PublicLearningPath;

export type MyLearningPathDetail = PublicLearningPathDetail;

export function listMyLearningPaths(): Promise<MyLearningPath[]> {
  return request.get("/learning-paths/");
}

export function getMyLearningPathDetail(
  id: number
): Promise<MyLearningPathDetail> {
  return request.get(`/learning-paths/${id}`);
}

export function updateMyLearningPath(
  id: number,
  payload: {
    title?: string;
    type?: string | null;
    description?: string;
    is_public?: boolean;
    cover_image_url?: string | null;
    category_id?: number | null;
    manual_weight?: number | null;
  }
): Promise<MyLearningPath> {
  return request.patch(`/learning-paths/${id}`, payload);
}

export type AttachLearningPathResult = {
  already_exists: boolean;
  learning_path: MyLearningPath;
};

export function attachPublicLearningPathToMe(
  id: number
): Promise<AttachLearningPathResult> {
  return request.post(`/learning-paths/me/${id}/attach`, {});
}

export function deleteMyLearningPath(id: number) {
  return request.delete(`/learning-paths/${id}`);
}

export function detachMyLearningPath(id: number) {
  return request.delete(`/learning-paths/me/${id}`);
}

export function addResourceToMyLearningPath(
  learningPathId: number,
  payload: {
    resource_id: number;
    order_index?: number;
    stage?: string | null;
    purpose?: string | null;
    estimated_time?: number | null;
    is_optional?: boolean;
    manual_weight?: number | null;
  }
) {
  return request.post(`/learning-paths/${learningPathId}/items`, payload);
}

export function removeResourceFromMyLearningPath(
  learningPathId: number,
  resourceId: number
) {
  return request.delete(
    `/learning-paths/${learningPathId}/items/${resourceId}`
  );
}

export function forkLearningPath(id: number): Promise<PublicLearningPath> {
  return request.post(`/learning-paths/${id}/fork`);
}

export type LearningPathUserStatus = {
  is_saved: boolean;
  has_forked: boolean;
};

export function getLearningPathUserStatus(
  id: number
): Promise<LearningPathUserStatus> {
  return request.get(`/learning-paths/me/${id}/status`);
}
