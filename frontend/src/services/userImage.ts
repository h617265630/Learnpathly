import request from "./request";

export interface UserImage {
  id: number;
  title: string | null;
  image_url: string;
  created_at: string;
}

export function listMyUserImages(): Promise<UserImage[]> {
  return request.get("/users/me/images");
}
