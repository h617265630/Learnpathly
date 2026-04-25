import request from "./request";

export type NoteRow = {
  path_item_id: number;
  notes: string;
  updated_at: string | null;
};

export function listMyNotesForLearningPath(learningPathId: number) {
  return request.get<NoteRow[], NoteRow[]>("/path-item-notes/me", {
    params: { learning_path_id: learningPathId },
  });
}

export function upsertMyNote(payload: { path_item_id: number; notes: string }) {
  return request.put<NoteRow, NoteRow>("/path-item-notes/me", payload);
}

export function deleteMyNote(pathItemId: number) {
  return request.delete(`/path-item-notes/me/${pathItemId}`);
}
