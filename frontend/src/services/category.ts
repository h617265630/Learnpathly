import request from "./request";

export type Category = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_system: boolean;
};

export function listCategories(): Promise<Category[]> {
  return request.get("/categories/");
}

export function createCategory(payload: {
  name: string;
  code?: string;
  description?: string | null;
}): Promise<Category> {
  return request.post("/categories/", payload);
}
