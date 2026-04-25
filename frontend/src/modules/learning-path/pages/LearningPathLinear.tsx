import React, { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/stores/auth";
import {
  ArrowDown,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Play,
  Sparkles,
  StickyNote,
  Video,
} from "lucide-react";
import {
  getMyLearningPathDetail,
  getPublicLearningPathDetail,
  type MyLearningPathDetail,
} from "@/services/learningPath";
import {
  getMyResourceDetail,
  type DbResourceDetail,
} from "@/services/resource";
import {
  listMyProgressForLearningPath,
  type ProgressRow,
} from "@/services/progress";
import {
  listMyNotesForLearningPath,
  upsertMyNote,
  type NoteRow,
} from "@/services/pathItemNote";
import { Button } from "@/components/ui/Button";

// ─── Types ──────────────────────────────────────────────────────────────────

type PathItem = {
  id: number;
  resourceId: number;
  title: string;
  summary: string;
  type: "video" | "document" | "article";
  duration: string;
  progress: number;
  notes: string;
  completed: boolean;
  thumbnail: string;
  currentPage?: number;
  totalPages?: number;
};

type LearningPathData = {
  id: number;
  title: string;
  description: string;
  totalProgress: number;
  items: PathItem[];
};

type CoverMeta = {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  type: string;
  category: string;
  level: string;
  items: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function asPresentedType(raw: unknown): PathItem["type"] {
  const t = String(raw || "").toLowerCase().trim();
  if (t === "document") return "document";
  if (t === "article") return "article";
  return "video";
}

function getEmbeddedResource(
  it: any
): DbResourceDetail | null {
  const r = it?.resource_data;
  return r && typeof r === "object" ? (r as DbResourceDetail) : null;
}

function typeIcon(type: PathItem["type"]) {
  switch (type) {
    case "video":
      return Video;
    case "document":
      return FileText;
    case "article":
      return BookOpen;
  }
}

function typeColor(type: PathItem["type"]) {
  switch (type) {
    case "video":
      return "bg-purple-100 text-purple-600";
    case "document":
      return "bg-blue-100 text-blue-600";
    case "article":
      return "bg-green-100 text-green-600";
  }
}

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop";

// ─── Component ──────────────────────────────────────────────────────────────

export default function LearningPathLinear() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromMyPaths = searchParams.get("from") === "my-paths";
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const learningPathId = (() => {
    const trimmed = String(id || "").trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  })();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [lp, setLp] = useState<MyLearningPathDetail | null>(null);
  const [resourcesById, setResourcesById] = useState<Record<number, DbResourceDetail>>({});
  const [progressByPathItemId, setProgressByPathItemId] = useState<Record<number, number>>({});
  const [notesByPathItemId, setNotesByPathItemId] = useState<Record<number, string>>({});

  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const pollTimerRef = useRef<number | null>(null);
  const notesPollTimerRef = useRef<number | null>(null);

  // ── Refresh notes ────────────────────────────────────────────────────────

  const refreshNotes = useCallback(async () => {
    const lid = learningPathId;
    if (!lid) return;
    try {
      const rows = await listMyNotesForLearningPath(lid);
      const next: Record<number, string> = {};
      for (const r of rows || []) {
        next[Number((r as NoteRow).path_item_id)] = String(
          (r as NoteRow).notes || ""
        );
      }
      setNotesByPathItemId((prev) => ({ ...prev, ...next }));
    } catch {
      // ignore polling errors
    }
  }, [learningPathId]);

  // ── Refresh progress ──────────────────────────────────────────────────────

  const refreshProgress = useCallback(async () => {
    const lid = learningPathId;
    if (!lid) return;
    try {
      const rows = await listMyProgressForLearningPath(lid);
      const next: Record<number, number> = {};
      for (const r of rows || []) {
        next[Number((r as ProgressRow).path_item_id)] =
          Number((r as ProgressRow).progress_percentage) || 0;
      }
      setProgressByPathItemId(next);
    } catch {
      // ignore polling errors
    }
  }, [learningPathId]);

  // ── Load main data ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    const lid = learningPathId;
    if (!lid) return;
    setError("");
    setLoading(true);
    try {
      const detail = isAuthed && !fromMyPaths
        ? await getMyLearningPathDetail(lid)
        : await getPublicLearningPathDetail(lid);
      setLp(detail);

      // Hydrate embedded resource_data / fetch missing
      const embeddedMap: Record<number, DbResourceDetail> = {};
      const missing: number[] = [];
      for (const it of detail.path_items || []) {
        const rid = Number((it as any).resource_id);
        if (!rid) continue;
        const embedded = getEmbeddedResource(it as any);
        if (embedded) embeddedMap[rid] = embedded;
        else missing.push(rid);
      }

      const uniqueMissing = Array.from(new Set(missing));
      const fetchedPairs = await Promise.all(
        uniqueMissing.map(async (rid) => {
          const r = await getMyResourceDetail(rid);
          return [rid, r] as const;
        })
      );
      for (const [rid, r] of fetchedPairs) embeddedMap[rid] = r;
      setResourcesById(embeddedMap);

      // Seed notes from existing items
      setNotesByPathItemId((prev) => {
        const next = { ...prev };
        for (const it of detail.path_items || []) {
          const pid = Number(it.id);
          if (pid && !Object.prototype.hasOwnProperty.call(next, pid)) {
            next[pid] = "";
          }
        }
        return next;
      });

      // Fetch progress and notes only when logged in
      if (isAuthed) {
        await refreshProgress();
        await refreshNotes();
      }
    } catch (e: any) {
      setError(
        String(
          e?.response?.data?.detail || e?.message || "Failed to load learning path"
        )
      );
      setLp(null);
      setResourcesById({});
      setProgressByPathItemId({});
    } finally {
      setLoading(false);
    }
  }, [learningPathId, isAuthed, fromMyPaths, refreshProgress, refreshNotes]);

  // ── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    setEditingNotes(null);
    setNoteDraft("");
    void load();
  }, [id, fromMyPaths]);

  useEffect(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (notesPollTimerRef.current !== null) {
      window.clearInterval(notesPollTimerRef.current);
      notesPollTimerRef.current = null;
    }
    if (learningPathId !== null && isAuthed) {
      pollTimerRef.current = window.setInterval(() => {
        void refreshProgress();
      }, 10_000);
      notesPollTimerRef.current = window.setInterval(() => {
        void refreshNotes();
      }, 10_000);
    }
    return () => {
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (notesPollTimerRef.current !== null) {
        window.clearInterval(notesPollTimerRef.current);
        notesPollTimerRef.current = null;
      }
    };
  }, [learningPathId, isAuthed, refreshProgress, refreshNotes]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const path = ((): CoverMeta | null => {
    if (!lp) return null;
    const firstItem: any = lp.path_items?.[0];
    const cover = getEmbeddedResource(firstItem) || (firstItem?.resource_id
      ? resourcesById[Number(firstItem.resource_id)]
      : undefined);
    return {
      id: lp.id,
      title: lp.title,
      description: lp.description || "",
      thumbnail: (cover?.thumbnail || "").trim(),
      type: String((lp as any)?.type || "").trim(),
      category: lp.category_name || "My Paths",
      level: lp.is_public ? "Public" : "Private",
      items: (lp.path_items || []).length,
    };
  })();

  const learningPath = ((): LearningPathData => {
    const title = path?.title || "Learning Path";
    const description = path?.description || "";

    const items: PathItem[] = (lp?.path_items || [])
      .slice()
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map((it) => {
        const embedded = getEmbeddedResource(it as any);
        const res = embedded || resourcesById[it.resource_id];
        const type = asPresentedType(
          res?.resource_type || (it as any).resource_type
        );

        const pid = Number(it.id);
        const progress = progressByPathItemId[pid] ?? 0;

        return {
          id: pid,
          resourceId: Number(it.resource_id),
          title: String(
            res?.title || it.title || `Resource ${it.resource_id}`
          ),
          summary: String(res?.summary || ""),
          type,
          duration: type === "video" ? "—" : "—",
          progress,
          notes: notesByPathItemId[pid] ?? "",
          completed: progress >= 100,
          thumbnail:
            (res?.thumbnail || "").trim() || FALLBACK_THUMB,
        };
      });

    const totalProgress =
      items.length
        ? Math.round(
            items.reduce((sum, item) => sum + item.progress, 0) / items.length
          )
        : 0;

    return {
      id: lp?.id || 0,
      title,
      description,
      totalProgress,
      items,
    };
  })();

  // ── Notes editing ────────────────────────────────────────────────────────

  function startEdit(itemId: number) {
    setEditingNotes(itemId);
    setNoteDraft(notesByPathItemId[itemId] || "");
  }

  async function saveNotes(itemId: number) {
    setNotesByPathItemId((prev) => ({
      ...prev,
      [itemId]: noteDraft,
    }));
    setEditingNotes(null);
    setNoteDraft("");
    try {
      await upsertMyNote({ path_item_id: itemId, notes: noteDraft });
    } catch {
      // silently keep local state — next poll will reconcile
    }
  }

  function cancelNotes() {
    setEditingNotes(null);
    setNoteDraft("");
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  function goToResource(item: PathItem) {
    const name =
      item.type === "video"
        ? "resource-video"
        : item.type === "document"
          ? "resource-document"
          : "resource-article";
    navigate({
      pathname: `/resources/${item.type}/${item.resourceId}`,
      search: `?path_item_id=${item.id}&learning_path_id=${learningPathId || ""}`,
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="inline-flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm text-stone-400">Loading…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="rounded-md border border-red-100 bg-red-50/50 p-6 text-center">
          <p className="text-sm text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 bg-stone-50 min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="pb-0">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">
              {path?.title || learningPath.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500 whitespace-pre-wrap">
              {path?.description || learningPath.description}
            </p>
          </div>
          <div className="md:col-span-4 md:flex md:justify-end md:items-end">
            <div className="text-right">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-stone-400">
                Overall Progress
              </p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">
                {learningPath.totalProgress}%
              </p>
            </div>
          </div>
        </div>

        {path && (
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 border border-stone-200 bg-white text-stone-700 font-semibold rounded-none">
              {path.category}
            </span>
            <span className="px-2 py-1 border border-stone-200 bg-white text-stone-500 rounded-none">
              {path.level}
            </span>
            <span className="px-2 py-1 border border-stone-200 bg-white text-stone-500 rounded-none">
              {path.items} items
            </span>
          </div>
        )}

        <div className="mt-6">
          <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-stone-900 transition-all duration-300"
              style={{ width: `${learningPath.totalProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Cover image ─────────────────────────────────────────────────── */}
      {path && (
        <section>
          <div className="relative h-56 md:h-64 bg-stone-200 overflow-hidden">
            <img
              src={path.thumbnail || FALLBACK_THUMB}
              alt={path.title}
              className="w-full h-full object-cover"
            />
            {path.type && (
              <span className="absolute right-3 top-3 px-2 py-1 rounded-none border border-stone-200 bg-white text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-700">
                {path.type}
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-stone-200" />

        {/* Path Items */}
        <div className="space-y-8">
          {learningPath.items.map((item, index) => (
            <div key={item.id}>
              <div className="relative pl-16">
                {/* Timeline Node */}
                <div className="absolute left-0 top-6 w-12 h-12 flex items-center justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.completed || item.progress > 0
                        ? "bg-stone-900 text-white"
                        : "bg-white border-4 border-stone-200 text-stone-400"
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </div>
                </div>

                {/* Card: content (left) + progress/notes (right) */}
                <div className="bg-white border border-stone-100 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
                    {/* ── Left: Content ─────────────────────────────────────── */}
                    <div className="p-6">
                      {/* Thumbnail */}
                      <div
                        className="relative mb-4 overflow-hidden bg-stone-100 group cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => goToResource(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            goToResource(item);
                          }
                        }}
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />

                        {/* Video play overlay */}
                        {item.type === "video" && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-stone-900 ml-1" />
                            </div>
                          </div>
                        )}

                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <div
                            className={`px-3 py-1 rounded-full flex items-center gap-2 ${typeColor(item.type)}`}
                          >
                            {React.createElement(typeIcon(item.type), {
                              className: "w-5 h-5",
                            })}
                            <span className="text-sm capitalize">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Title and description */}
                      <div className="mb-4">
                        <h3 className="text-stone-900 mb-2 font-semibold text-base">
                          {item.title}
                        </h3>
                        <p className="text-sm text-stone-500 line-clamp-3">
                          {item.summary}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <Button
                        type="button"
                        className="w-full rounded-none"
                        onClick={() => goToResource(item)}
                      >
                        {item.type === "video" && (
                          <Play className="w-4 h-4" />
                        )}
                        {item.progress === 0 ? "Start Learning" : "Continue Learning"}
                      </Button>
                    </div>

                    {/* ── Right: Progress + Notes ──────────────────────────── */}
                    <div className="p-6 bg-stone-50/50">
                      {/* Learning Progress */}
                      <div className="mb-6">
                        <h4 className="text-stone-900 mb-3 font-semibold text-sm">
                          Learning Progress
                        </h4>

                        {/* Progress bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-stone-500">
                              Completion
                            </span>
                            <span className="text-sm text-stone-900">
                              {item.progress}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-stone-900 transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Detail info */}
                        <div className="space-y-2">
                          {item.type === "video" ? (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-stone-500">Duration:</span>
                              <span className="text-stone-900">
                                {item.duration || "—"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-stone-500">Pages:</span>
                              <span className="text-stone-900">
                                {typeof item.totalPages === "number"
                                  ? item.totalPages
                                  : "—"}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-500">Status:</span>
                            <span
                              className={`px-2 py-1 border text-xs rounded-none ${
                                item.completed
                                  ? "border-stone-300 bg-white text-stone-900"
                                  : item.progress > 0
                                    ? "border-stone-300 bg-white text-stone-900"
                                    : "border-stone-200 bg-white text-stone-400"
                              }`}
                            >
                              {item.completed
                                ? "Completed"
                                : item.progress > 0
                                  ? "In Progress"
                                  : "Not Started"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <StickyNote className="w-4 h-4 text-stone-400" />
                          <h4 className="text-stone-900 font-semibold text-sm">
                            My Notes
                          </h4>
                        </div>

                        {editingNotes === item.id ? (
                          <div>
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              className="w-full resize-none border border-stone-200 bg-white p-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-1 rounded-none"
                              rows={6}
                              placeholder="Add your notes here..."
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-none"
                                onClick={() => saveNotes(item.id)}
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-none"
                                onClick={cancelNotes}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer"
                            onClick={() => startEdit(item.id)}
                          >
                            {item.notes ? (
                              <div className="min-h-20 whitespace-pre-wrap border border-stone-200 bg-white p-3 text-sm text-stone-900 rounded-none">
                                {item.notes}
                              </div>
                            ) : (
                              <div className="min-h-[80px] flex items-center justify-center border border-dashed border-stone-200 bg-white p-3 text-sm text-stone-400 rounded-none">
                                Click to add notes...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow between cards */}
              {index < learningPath.items.length - 1 && (
                <div className="relative pl-16 py-4">
                  <div className="absolute left-6 top-0 bottom-0 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <ArrowDown className="w-6 h-6 text-stone-400 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Completion Celebration ──────────────────────────────────────── */}
        <div className="relative pl-16 mt-8">
          <div className="absolute left-0 top-6 w-12 h-12 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-stone-900 text-white">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-stone-100 p-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-stone-400" />
                <h2 className="text-stone-900 font-semibold text-lg">
                  Congratulations!
                </h2>
                <Sparkles className="w-6 h-6 text-stone-400" />
              </div>

              <p className="text-stone-900 mb-4 text-lg">
                You&apos;ve completed the entire learning path!
              </p>

              <div className="space-y-2 text-stone-500 mb-6 text-sm">
                <p>
                  From here, you&apos;ve mastered all the core knowledge of{" "}
                  <span className="text-stone-900 font-medium">
                    {learningPath.title}
                  </span>
                  .
                </p>
                <p>Every step of effort is worth pride, and every note is a testament to your growth.</p>
                <p className="text-stone-900">
                  Keep this passion going — apply what you&apos;ve learned and create something amazing!
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button type="button" size="sm" className="rounded-none">
                  <Award className="w-4 h-4" />
                  View Certificate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                >
                  Start New Path
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
