import request from "./request";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
}

export function getCurrentUser(): Promise<UserProfile> {
  return request.get("/users/me");
}

export function updateCurrentUser(payload: {
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}): Promise<UserProfile> {
  return request.patch("/users/me", payload);
}

export function uploadMyAvatar(file: File): Promise<{ avatar_url: string }> {
  const form = new FormData();
  form.append("file", file);
  return request.post("/users/me/avatar", form);
}

export function changeMyPassword(payload: {
  current_password: string;
  new_password: string;
}) {
  return request.post("/users/me/password", payload);
}
