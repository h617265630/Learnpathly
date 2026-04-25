import request from "./request";

export type ProgressRow = {
  path_item_id: number;
  progress_percentage: number;
  last_watched_time?: string | null;
};

export function listMyProgressForLearningPath(learningPathId: number) {
  return request.get<ProgressRow[], ProgressRow[]>("/progress/me", {
    params: { learning_path_id: learningPathId },
  });
}

export function getMyProgressForItem(pathItemId: number) {
  return request.get<ProgressRow, ProgressRow>(
    `/progress/me/item/${pathItemId}`
  );
}

export function upsertMyProgress(payload: {
  path_item_id: number;
  progress_percentage: number;
}) {
  return request.put<ProgressRow, ProgressRow>("/progress/me", payload);
}
