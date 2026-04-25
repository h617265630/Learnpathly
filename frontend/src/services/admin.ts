import request from "./request";

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_learning_paths: number;
  total_resources: number;
  users_last_7_days: number;
  paths_last_7_days: number;
  resources_last_7_days: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  roles: string[];
  created_at: string;
}

export interface AdminResource {
  id: number;
  title: string;
  resource_type: string;
  platform?: string | null;
  category_name?: string | null;
  save_count: number;
  trending_score: number;
  created_at: string;
}

export interface AdminLearningPath {
  id: number;
  title: string;
  category_name?: string | null;
  is_public: boolean;
  is_active: boolean;
  user_count: number;
  created_at: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
}

export interface PaginatedResources {
  resources: AdminResource[];
  total: number;
}

export interface PaginatedPaths {
  paths: AdminLearningPath[];
  total: number;
}

export interface GetAdminUsersParams {
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface GetAdminResourcesParams {
  skip?: number;
  limit?: number;
}

export interface GetAdminPathsParams {
  skip?: number;
  limit?: number;
}

export interface AdminCategory {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_system: boolean;
  owner_user_id?: number | null;
  level: number;
  is_leaf: boolean;
}

export function getAdminStats(): Promise<AdminStats> {
  return request.get("/admin/stats");
}

export function getAdminUsers(
  params?: GetAdminUsersParams
): Promise<PaginatedUsers> {
  return request.get("/admin/users", { params });
}

export function getAdminResources(
  params?: GetAdminResourcesParams
): Promise<PaginatedResources> {
  return request.get("/admin/resources", { params });
}

export function getAdminLearningPaths(
  params?: GetAdminPathsParams
): Promise<PaginatedPaths> {
  return request.get("/admin/learning-paths", { params });
}

export function toggleUserStatus(userId: number) {
  return request.post(`/admin/users/${userId}/toggle-status`);
}

export function toggleSuperuserStatus(userId: number) {
  return request.post(`/admin/users/${userId}/toggle-superuser`);
}

export function deleteAdminResource(resourceId: number) {
  return request.delete(`/admin/resources/${resourceId}`);
}

export function deleteAdminLearningPath(pathId: number) {
  return request.delete(`/admin/learning-paths/${pathId}`);
}

// Category management
export function getAdminCategories(): Promise<AdminCategory[]> {
  return request.get("/admin/categories");
}

export function createAdminCategory(payload: {
  name: string;
  code?: string;
  description?: string | null;
}): Promise<AdminCategory> {
  return request.post("/admin/categories", payload);
}

export function deleteAdminCategory(categoryId: number) {
  return request.delete(`/admin/categories/${categoryId}`);
}
