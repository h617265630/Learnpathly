import React, { useEffect, useState, useCallback } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "@/stores/auth";
import "@/components/card-ui.css";
import {
  getPublicLearningPathDetail,
  getMyLearningPathDetail,
  attachPublicLearningPathToMe,
  forkLearningPath,
  getLearningPathUserStatus,
  type PublicLearningPathDetail,
} from "@/services/learningPath";
import { Button } from "@/components/ui/Button";
import { ResourceCard, type UiResource } from "@/components/ResourceCard";
import {
  inferModuleType,
  FALLBACK_THUMB,
  type ModuleType,
} from "../utils/resourceUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

type Module = {
  id: string;
  resourceId: string;
  title: string;
  summary: string;
  type: ModuleType;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  orderIndex: number;
  resourceData: any; // embedded resource_data from backend
  manualWeight?: number | null; // for card UI weight
};
function moduleToUiResource(m: Module): UiResource {
  const r = m.resourceData;
  return {
    id: Number(m.resourceId) || 0,
    title: m.title,
    summary: m.summary,
    categoryLabel: r?.category_name || "",
    categoryColor: getCategoryColor(r?.category_name),
    platform: r?.platform || "",
    platformLabel: formatPlatform(r?.platform),
    typeLabel: m.type,
    thumbnail: moduleThumb(m),
    resource_type: m.type,
  };
}

function fromManualWeight(w: number | null | undefined): string {
  const reverseMap: Record<number, string> = {
    1: "tier-gold",
    2: "tier-diamond",
    3: "tier-prismatic",
    4: "tier-obsidian",
    5: "gradient-emerald",
    6: "gradient-sapphire",
    7: "gradient-ruby",
    8: "gradient-amethyst",
    9: "gradient-gold",
    10: "neu",
    11: "holo",
    12: "sketch",
    13: "newspaper",
    14: "neon-cyan",
    15: "neon-pink",
    16: "neon-green",
    17: "neon-purple",
    18: "neon-gold",
    19: "metallic-steel",
    20: "metallic-copper",
    21: "metallic-titanium",
    22: "metallic-rose-gold",
    23: "metallic-gunmetal",
    24: "papercut-coral",
    25: "papercut-sky",
    26: "papercut-mint",
    27: "papercut-lavender",
    28: "papercut-peach",
    100: "default",
  };
  return reverseMap[Number(w)] ?? "default";
}

function moduleThumb(m: Module): string {
  const r = m.resourceData;
  const url = String(r?.thumbnail || "").trim();
  return url || FALLBACK_THUMB;
}

function getCategoryColor(category?: string): string {
  const key =
    String(category || "")
      .trim()
      .toLowerCase() || "other";
  const palette = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#f97316",
    "#84cc16",
  ];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function formatPlatform(platform?: string | null): string {
  if (!platform) return "";
  const map: Record<string, string> = {
    youtube: "YouTube",
    bilibili: "Bilibili",
    jike: "Jike",
    github: "GitHub",
    douyin: "Douyin",
    xiaohongshu: "小红书",
    wechat: "WeChat",
    weibo: "Weibo",
    podcast: "Podcast",
    website: "Website",
  };
  return map[platform.toLowerCase()] || platform;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LearningPathDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromMyPaths = searchParams.get("from") === "my-paths";

  const { isAuthed } = useAuth();
  const navigate = useNavigate();

  const [path, setPath] = useState<PublicLearningPathDetail | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [usingThisPath, setUsingThisPath] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [useModalState, setUseModalState] = useState<
    "confirm" | "done" | "error" | "fork_error" | "fork_success"
  >("confirm");
  const [useModalTitle, setUseModalTitle] = useState("Use this path");
  const [useModalMessage, setUseModalMessage] = useState(
    "Save this path to your My Paths?"
  );
  const [useModalHint, setUseModalHint] = useState("");

  const [forking, setForking] = useState(false);
  const [forkedId, setForkedId] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasForked, setHasForked] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Path ID is missing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nid = Number(id);
      if (!Number.isFinite(nid)) throw new Error("Invalid path id");

      const isMy = fromMyPaths;
      const detail = isMy
        ? await getMyLearningPathDetail(nid)
        : await getPublicLearningPathDetail(nid);

      setPath(detail);

      const items = Array.isArray(detail.path_items) ? detail.path_items : [];

      const mapped: Module[] = items.map((it: any) => {
        const r = (it?.resource_data || null) as any;
        const uiType: ModuleType = inferModuleType(it, r);
        return {
          id: String(it.id),
          resourceId: String(it.resource_id),
          title: String(it.title || r?.title || `Resource ${it.resource_id}`),
          summary: String(r?.summary || ""),
          type: uiType,
          duration: "",
          level: "Beginner" as const,
          orderIndex: Number(it.order_index) || 0,
          resourceData: r,
          manualWeight: (it as any).manual_weight ?? null,
        };
      });

      setModules(mapped);

      // Check user status for public paths (not for "my paths")
      if (!isMy && isAuthed) {
        try {
          const status = await getLearningPathUserStatus(nid);
          setIsSaved(status.is_saved);
          setHasForked(status.has_forked);
        } catch {
          // Ignore status check errors
        }
      }
    } catch (e: any) {
      setError(
        String(e?.response?.data?.detail || e?.message || "Failed to load path")
      );
    } finally {
      setLoading(false);
    }
  }, [id, fromMyPaths, isAuthed]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  function openResource(m: Module) {
    if (!m.resourceId) return;
    const query: Record<string, string> = {};
    if (m.id) query.path_item_id = String(m.id);

    if (m.type === "video" || m.type === "clip") {
      navigate({
        pathname: `/resources/video/${m.resourceId}`,
        search: new URLSearchParams(query).toString()
          ? `?${new URLSearchParams(query).toString()}`
          : undefined,
      });
      return;
    }
    if (m.type === "document") {
      navigate({
        pathname: `/resources/document/${m.resourceId}`,
        search: new URLSearchParams(query).toString()
          ? `?${new URLSearchParams(query).toString()}`
          : undefined,
      });
      return;
    }
    navigate({
      pathname: `/resources/article/${m.resourceId}`,
      search: new URLSearchParams(query).toString()
        ? `?${new URLSearchParams(query).toString()}`
        : undefined,
    });
  }

  function startLearning() {
    if (!id) return;
    navigate({
      pathname: `/learningpath/${id}/linear`,
      search: fromMyPaths ? "?from=my-paths" : "",
    });
  }

  async function startLearningFromPublic() {
    if (usingThisPath || !id) return;
    if (!/^[0-9]+$/.test(id)) return;

    // If already saved, go directly to linear view
    if (isSaved) {
      navigate({ pathname: `/learningpath/${id}/linear`, search: "" });
      return;
    }

    setUsingThisPath(true);
    try {
      const nid = Number(id);
      const res = await attachPublicLearningPathToMe(nid);
      const nextId = res?.learning_path?.id;
      const finalId = typeof nextId === "number" ? String(nextId) : id;
      navigate({ pathname: `/learningpath/${finalId}/linear`, search: "" });
    } catch (e: any) {
      setShowUseModal(true);
      setUseModalState("error");
      setUseModalTitle("Failed to save");
      setUseModalMessage(
        String(e?.response?.data?.detail || e?.message || "Failed to save")
      );
      setUseModalHint("");
    } finally {
      setUsingThisPath(false);
    }
  }

  function openUseThisPath() {
    if (fromMyPaths) {
      startLearning();
      return;
    }
    setShowUseModal(true);
    setUseModalState("confirm");
    setUseModalTitle("Use this path");
    setUseModalMessage("Save this path to your My Paths?");
    setUseModalHint("After saving, you can view and edit it in My Paths.");
  }

  function closeUseModal() {
    if (useModalState === "fork_success" && forkedId != null) {
      setShowUseModal(false);
      setUseModalHint("");
      setUseModalState("confirm");
      navigate({
        pathname: `/learningpath/${String(forkedId)}`,
        search: "?from=my-paths",
      });
      return;
    }
    setShowUseModal(false);
    setUseModalHint("");
    setUseModalState("confirm");
  }

  async function confirmUseThisPath() {
    if (usingThisPath || !id) return;
    if (!/^[0-9]+$/.test(id)) return;

    setUsingThisPath(true);
    try {
      const nid = Number(id);
      const res = await attachPublicLearningPathToMe(nid);
      setUseModalState("done");
      setUseModalTitle(res?.already_exists ? "Already saved" : "Saved");
      setUseModalMessage(
        res?.already_exists
          ? "This path is already in your My Paths."
          : "Saved to My Paths."
      );
      setUseModalHint("");
      const nextId = res?.learning_path?.id;
      if (typeof nextId === "number") {
        navigate({
          pathname: `/learningpath/${String(nextId)}`,
          search: "?from=my-paths",
        });
      }
    } catch (e: any) {
      setUseModalState("error");
      setUseModalTitle("Failed to save");
      setUseModalMessage(
        String(e?.response?.data?.detail || e?.message || "Failed to save")
      );
      setUseModalHint("");
    } finally {
      setUsingThisPath(false);
    }
  }

  async function handleFork() {
    if (forking || !id) return;
    setForking(true);
    try {
      const nid = Number(id);
      const res = await forkLearningPath(nid);
      const fid = res?.id;
      setForkedId(fid ?? null);
      setShowUseModal(true);
      setUseModalState("fork_success");
      setUseModalTitle("Fork successful!");
      setUseModalMessage("This path has been forked to your account.");
      setUseModalHint("");
    } catch (e: any) {
      setShowUseModal(true);
      setUseModalState("fork_error");
      setUseModalTitle("Fork failed");
      setUseModalMessage(
        String(
          e?.response?.data?.detail || e?.message || "Failed to fork this path"
        )
      );
      setUseModalHint("");
    } finally {
      setForking(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      {/* Header */}
      {loading && (
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-stone-400">Loading…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="py-12 rounded-md border border-red-100 bg-red-50/50 p-6 text-center">
          <p className="text-sm text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && path && (
        <>
          {/* Header section */}
          <section className="pb-6">
            {/* Title and meta row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                  {path.title || "Learning Path"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {path.description || "No description."}
                </p>
              </div>

              {/* Primary action - always visible */}
              <Button
                type="button"
                size="lg"
                className="shrink-0 bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-200/50 font-semibold"
                onClick={fromMyPaths || !isAuthed ? startLearning : startLearningFromPublic}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Learning
              </Button>
            </div>

            {/* Meta pills row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                {path.category_name || "Learning Path"}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-xs">
                {path.is_public ? "Public" : "Private"}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-xs">
                {modules.length} items
              </span>

              {/* Secondary actions */}
              <div className="flex items-center gap-2 ml-auto">
                {!fromMyPaths && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-violet-600 text-white hover:bg-violet-700 font-medium"
                      disabled={usingThisPath || isSaved}
                      onClick={openUseThisPath}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1.5"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      {isSaved ? "Saved" : usingThisPath ? "Saving…" : "Save"}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-stone-300 text-stone-700 hover:bg-stone-50 font-medium"
                      disabled={forking || hasForked}
                      onClick={handleFork}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1.5"
                      >
                        <circle cx="12" cy="18" r="3" />
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="18" cy="6" r="3" />
                        <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
                        <path d="M12 12v3" />
                      </svg>
                      {hasForked ? "Forked" : forking ? "Forking…" : "Fork"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Cover */}
          {path.cover_image_url && (
            <div className="relative h-96 bg-stone-100 overflow-hidden rounded-md">
              <img
                src={path.cover_image_url}
                alt={path.title}
                className="w-full h-full object-cover object-center"
              />
              {path.type && (
                <span className="absolute right-3 top-3 px-2 py-1 rounded-full border border-stone-200 bg-white/90 text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-700">
                  {path.type}
                </span>
              )}
            </div>
          )}

          {/* Items */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium tracking-[0.14em] uppercase text-foreground">
                  Path Content
                </h2>
                <p className="text-sm text-muted-foreground">
                  {modules.length} modules
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {modules.map((m) => (
                <ResourceCard
                  key={m.id}
                  resource={moduleToUiResource(m)}
                  onOpen={() => openResource(m)}
                  onAdd={() => {}}
                  saving={false}
                  saved={false}
                  weight={fromManualWeight(m.manualWeight)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {!loading && !error && !path && (
        <div className="rounded-md border border-stone-100 p-5">
          <div className="text-sm text-muted-foreground">
            Learning path not found (id: {id}). You can select an existing card
            from LearningPool to enter.
          </div>
        </div>
      )}

      {/* Use modal */}
      {showUseModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-md bg-white shadow-2xl border border-stone-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-stone-900 text-sm font-medium tracking-[0.14em] uppercase">
                {useModalTitle}
              </h2>
              <button
                className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"
                onClick={closeUseModal}
                disabled={usingThisPath}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-stone-700">{useModalMessage}</p>
              {useModalHint && (
                <p className="text-sm text-stone-500">{useModalHint}</p>
              )}
            </div>

            <div className="p-6 pt-0 flex items-center justify-end gap-3">
              {useModalState === "confirm" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-stone-200 text-stone-600 hover:border-stone-400"
                    onClick={closeUseModal}
                    disabled={usingThisPath}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-foreground text-background hover:bg-foreground/90 border-0"
                    onClick={confirmUseThisPath}
                    disabled={usingThisPath}
                  >
                    {usingThisPath ? "Saving…" : "Save to My Paths"}
                  </Button>
                </>
              )}

              {useModalState === "fork_error" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-stone-200 text-stone-600 hover:border-stone-400"
                  onClick={closeUseModal}
                >
                  OK
                </Button>
              )}

              {useModalState !== "confirm" &&
                useModalState !== "fork_error" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-stone-200 text-stone-600 hover:border-stone-400"
                    onClick={closeUseModal}
                  >
                    OK
                  </Button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
