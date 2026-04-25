import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useAuthStore } from "@/stores/auth";
import {
  listMyLearningPaths,
  getMyLearningPathDetail,
  deleteMyLearningPath,
  detachMyLearningPath,
  type MyLearningPath,
} from "@/services/learningPath";
import { getResourceDetail, type DbResource } from "@/services/resource";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MyPathCard, type PoolPath } from "@/components/MyPathCard";

// ─── Types ──────────────────────────────────────────────────────────────────

type PathSource = "created" | "forked" | "saved";

type UiPath = MyLearningPath & {
  _coverUrl?: string;
  _source?: PathSource;
  _status?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizePathType(raw: unknown): string {
  return String(raw || "")
    .trim()
    .toLowerCase();
}

function typeLabel(raw: unknown): string {
  const t = normalizePathType(raw);
  if (t === "linear path") return "Linear";
  if (t === "structured path") return "Structured";
  if (t === "partical pool") return "Pool";
  return String(raw || "").trim() || "Path";
}

function typeColor(raw: unknown): string {
  const t = normalizePathType(raw);
  if (t === "linear path") return "bg-cyan-50 text-cyan-700";
  if (t === "structured path") return "bg-violet-50 text-violet-700";
  if (t === "partical pool") return "bg-amber-50 text-amber-700";
  return "bg-stone-100 text-stone-600";
}

function coverAccent(raw: unknown): string {
  const t = normalizePathType(raw);
  if (t === "linear path") return "bg-cyan-500";
  if (t === "structured path") return "bg-violet-500";
  if (t === "partical pool") return "bg-amber-500";
  return "bg-stone-400";
}

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop";

function classifyPath(p: UiPath, currentUserId: number): PathSource {
  if (p.creator_id === currentUserId) {
    if (p.parent_id != null) return "forked";
    return "created";
  }
  return "saved";
}

function sourceLabel(source: PathSource): string {
  if (source === "forked") return "Forked";
  if (source === "saved") return "Saved";
  return "Created";
}

function sourceBadgeBg(source: PathSource): string {
  if (source === "forked") return "bg-violet-50";
  if (source === "saved") return "bg-emerald-50";
  return "bg-amber-50";
}

function sourceBadgeText(source: PathSource): string {
  if (source === "forked") return "text-violet-700";
  if (source === "saved") return "text-emerald-700";
  return "text-amber-700";
}

function sourceAccent(source: PathSource): string {
  if (source === "forked") return "bg-violet-500";
  if (source === "saved") return "bg-emerald-500";
  return "bg-amber-500";
}

function mapToPoolPath(p: UiPath, fallbackIndex?: number): PoolPath {
  const lpType = normalizePathType((p as any)?.type);
  let typeLabel = "Path";
  if (lpType.includes("linear")) typeLabel = "Linear";
  else if (lpType.includes("struct")) typeLabel = "Structured";
  else if (lpType.includes("partical") || lpType.includes("pool"))
    typeLabel = "Pool";

  const rawId = (p as any)?.id ?? p.id;
  const pathId =
    rawId != null ? String(rawId) : `fallback-${fallbackIndex ?? "unknown"}`;
  return {
    id: pathId,
    title: String(p.title || "").trim(),
    description: String(p.description || "").trim(),
    category: String((p as any)?.category_name || "").trim() || "General",
    typeLabel,
    level: "Beginner",
    items: Number((p as any).item_count ?? 0),
    thumbnail: p._coverUrl || FALLBACK_THUMB,
    hotScore: 50,
    source: p._source,
    status: (p as UiPath)._status,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MyLearningPath() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();

  const [paths, setPaths] = useState<UiPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [activeTab, setActiveTab] = useState<
    "drafts" | "created" | "forked" | "saved"
  >("created");

  // Auth guard
  useEffect(() => {
    if (!isAuthed) {
      navigate("/login", { replace: true });
    }
  }, [isAuthed, navigate]);

  const loadPaths = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyLearningPaths();
      console.log(
        "[loadPaths] API raw response:",
        JSON.stringify(data).slice(0, 500)
      );
      const rows: UiPath[] = Array.isArray(data) ? data : [];
      console.log(
        "[loadPaths] rows count:",
        rows.length,
        "first row keys:",
        rows[0] ? Object.keys(rows[0]) : "none",
        "first row:",
        rows[0]
      );

      // Fetch cover thumbnails in parallel
      await Promise.allSettled(
        rows.map(async (p) => {
          try {
            const explicitCover = String(p.cover_image_url || "").trim();
            if (explicitCover) {
              p._coverUrl = explicitCover;
              return;
            }
            const detail = await getMyLearningPathDetail(p.id);
            const items = Array.isArray(detail.path_items)
              ? detail.path_items
              : [];
            let first = items[0];
            for (const it of items) {
              const a = Number((first as any)?.order_index);
              const b = Number((it as any)?.order_index);
              if (!first) {
                first = it;
                continue;
              }
              if (Number.isFinite(b) && (!Number.isFinite(a) || b < a))
                first = it;
            }
            let thumb = String(
              (first as any)?.resource_data?.thumbnail || ""
            ).trim();
            if (!thumb) {
              const rid = Number((first as any)?.resource_id);
              if (Number.isFinite(rid) && rid > 0) {
                try {
                  const r = await getResourceDetail(rid);
                  thumb = String(r?.thumbnail || "").trim();
                } catch {
                  /* ignore */
                }
              }
            }
            p._coverUrl = thumb;
          } catch {
            p._coverUrl = "";
          }
        })
      );

      // Classify source for each path
      const currentUserId = useAuthStore.getState().user?.id;
      rows.forEach((p) => {
        p._source = classifyPath(p as UiPath, currentUserId ?? 0);
        p._status = String((p as any).status || "").trim() || undefined;
      });

      setPaths(rows);
    } catch (e: any) {
      setError(
        String(
          e?.response?.data?.detail || e?.message || "Failed to load paths"
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    void loadPaths();
  }, [isAuthed, loadPaths]);

  function openDetail(id: number) {
    navigate({ pathname: `/learningpath/${id}`, search: "?from=my-paths" });
  }

  function openDeleteConfirm(id: number) {
    setDeleteId(id);
    setDeleteError("");
  }

  function closeDeleteConfirm() {
    if (deleteConfirming) return;
    setDeleteId(null);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    setDeleteConfirming(true);
    setDeleteError("");
    try {
      const path = paths.find((p) => p.id === deleteId);
      if ((path as UiPath)._source === "saved") {
        await detachMyLearningPath(deleteId);
      } else {
        await deleteMyLearningPath(deleteId);
      }
      await loadPaths();
      setDeleteId(null);
    } catch (e: any) {
      setDeleteError(
        String(e?.response?.data?.detail || e?.message || "Failed to delete")
      );
    } finally {
      setDeleteConfirming(false);
    }
  }

  const draftPaths = paths.filter(
    (p) =>
      (p as UiPath)._source === "created" && (p as UiPath)._status === "draft"
  );
  const createdPaths = paths.filter(
    (p) =>
      (p as UiPath)._source === "created" && (p as UiPath)._status !== "draft"
  );
  const forkedPaths = paths.filter(
    (p) => (p as UiPath)._source === "forked"
  );
  const savedPaths = paths.filter(
    (p) =>
      (p as UiPath)._source === "saved" && (p as UiPath)._status !== "draft"
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Personal
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.92]">
                My
                <br />
                <span className="text-amber-500">Paths.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-xs text-stone-400">
                <span className="font-semibold text-stone-700">
                  {paths.length}
                </span>{" "}
                learning paths
              </span>
              {draftPaths.length > 0 && (
                <span className="text-xs text-stone-500">
                  {draftPaths.length} drafts
                </span>
              )}
              {createdPaths.length > 0 && (
                <span className="text-xs text-amber-600">
                  {createdPaths.length} published
                </span>
              )}
              {forkedPaths.length > 0 && (
                <span className="text-xs text-violet-600">
                  {forkedPaths.length} forked
                </span>
              )}
              {savedPaths.length > 0 && (
                <span className="text-xs text-emerald-600">
                  {savedPaths.length} saved
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-6">
            <Link
              to="/createpath"
              className="inline-flex items-center justify-center gap-2 transition-all duration-150 h-8 px-5 text-xs rounded-md font-semibold bg-amber-500 text-white hover:bg-amber-600"
            >
              + New path
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm text-stone-400">
                Loading your paths…
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-12 rounded-md border border-red-100 bg-red-50/50 p-6 text-center">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && paths.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/favicon.png"
                alt="Learnpathly"
                className="h-12 w-12"
              />
            </div>
            <h3 className="text-base font-semibold text-stone-700 mb-1">
              No learning paths yet
            </h3>
            <p className="text-sm text-stone-400 mb-5">
              Create your first learning path and start building.
            </p>
            <Link
              to="/createpath"
              className="inline-flex items-center justify-center gap-2 transition-all duration-150 h-9 px-5 text-sm rounded-md font-semibold bg-amber-500 text-white hover:bg-amber-600"
            >
              Create your first path →
            </Link>
          </div>
        )}

        {/* Tabs */}
        {!loading && !error && paths.length > 0 && (
          <div>
            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-8 border-b border-stone-200">
              {[
                {
                  key: "created" as const,
                  label: "Published",
                  count: createdPaths.length,
                  accent: sourceAccent("created"),
                },
                {
                  key: "forked" as const,
                  label: "Forked",
                  count: forkedPaths.length,
                  accent: sourceAccent("forked"),
                },
                {
                  key: "saved" as const,
                  label: "Saved",
                  count: savedPaths.length,
                  accent: sourceAccent("saved"),
                },
                {
                  key: "drafts" as const,
                  label: "Drafts",
                  count: draftPaths.length,
                  accent: "bg-stone-300",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? `border-current text-stone-900`
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  }`}
                >
                  <span
                    className={`w-1 h-4 rounded-full ${
                      activeTab === tab.key ? tab.accent : "bg-stone-200"
                    }`}
                  />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "drafts" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 items-start">
                {draftPaths.map((path, idx) => (
                  <MyPathCard
                    key={path.id ?? `draft-${idx}`}
                    path={mapToPoolPath(path, idx)}
                    onClick={() =>
                      navigate(`/learningpath/${path.id}?from=my-paths`)
                    }
                    onEdit={() => navigate(`/learningpath/${path.id}/edit`)}
                    onDelete={() => openDeleteConfirm(path.id)}
                  />
                ))}
              </div>
            )}

            {activeTab === "created" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 items-start">
                {createdPaths.map((path, idx) => (
                  <MyPathCard
                    key={path.id ?? `created-${idx}`}
                    path={mapToPoolPath(path, idx)}
                    onClick={() =>
                      navigate(`/learningpath/${path.id}?from=my-paths`)
                    }
                    onEdit={() => navigate(`/learningpath/${path.id}/edit`)}
                    onDelete={() => openDeleteConfirm(path.id)}
                  />
                ))}
              </div>
            )}

            {activeTab === "forked" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 items-start">
                {forkedPaths.map((path, idx) => (
                  <MyPathCard
                    key={path.id ?? `forked-${idx}`}
                    path={mapToPoolPath(path, idx)}
                    onClick={() =>
                      navigate(`/learningpath/${path.id}?from=my-paths`)
                    }
                    onEdit={() => navigate(`/learningpath/${path.id}/edit`)}
                    onDelete={() => openDeleteConfirm(path.id)}
                    showSource
                    rightCategory="Forked"
                  />
                ))}
              </div>
            )}

            {activeTab === "saved" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 items-start">
                {savedPaths.map((path, idx) => (
                  <MyPathCard
                    key={path.id ?? `saved-${idx}`}
                    path={mapToPoolPath(path, idx)}
                    onClick={() =>
                      navigate(`/learningpath/${path.id}?from=my-paths`)
                    }
                    onEdit={undefined}
                    onDelete={() => openDeleteConfirm(path.id)}
                    showSource
                    rightCategory="Saved"
                  />
                ))}
              </div>
            )}

            {/* Empty tab */}
            {activeTab === "drafts" && draftPaths.length === 0 && (
              <div className="py-16 text-center text-sm text-stone-400">
                No drafts yet.
              </div>
            )}
            {activeTab === "created" && createdPaths.length === 0 && (
              <div className="py-16 text-center text-sm text-stone-400">
                No published paths yet.
              </div>
            )}
            {activeTab === "forked" && forkedPaths.length === 0 && (
              <div className="py-16 text-center text-sm text-stone-400">
                No forked paths yet.
              </div>
            )}
            {activeTab === "saved" && savedPaths.length === 0 && (
              <div className="py-16 text-center text-sm text-stone-400">
                No saved paths yet.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete confirm dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md bg-white shadow-2xl border border-stone-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                Delete learning path?
              </h2>
              <button
                className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"
                onClick={closeDeleteConfirm}
                disabled={deleteConfirming}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-stone-600">
                {(paths.find((p) => p.id === deleteId) as UiPath)?._source ===
                "saved"
                  ? "This will remove the path from your collection."
                  : "This will permanently delete the path. This action cannot be undone."}
              </p>
              {deleteError && (
                <p className="text-sm text-red-500">{deleteError}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={closeDeleteConfirm}
                disabled={deleteConfirming}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-red-500 text-white hover:bg-red-600 border-0"
                onClick={confirmDelete}
                disabled={deleteConfirming}
              >
                {deleteConfirming ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
