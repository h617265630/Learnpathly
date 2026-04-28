import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  getPublicLearningPathAiResourceSummaries,
  type LearningPathAiResourceSummaryItem,
  type PublicLearningPathDetail,
} from "@/services/learningPath";
import {
  getAiPathProject,
  getAiPathProjectByLearningPathId,
  listAiPathProjects,
  type AiPathGenerateResponse,
  type AiPathResourceLink,
  type AiPathSubNode,
} from "@/services/aiPath";
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
  stage?: string | null;
  purpose?: string | null;
  estimatedTime?: number | null;
  resourceData: any; // embedded resource_data from backend
  manualWeight?: number | null;
};

function aiPathResourceToUiResource(
  resource: AiPathResourceLink,
  index: number
): UiResource {
  const url = String(resource.url || "").trim();
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "resource";
    }
  })();
  const type = String(resource.resource_type || "").trim() || "resource";
  const thumb =
    String(resource.image || "").trim() ||
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=256`;
  return {
    id: index + 1,
    title: String(resource.title || url),
    summary: String(resource.summary || resource.description || url),
    categoryLabel: type,
    categoryColor: "#3b82f6",
    platform: host.includes("github.com") ? "github" : host,
    platformLabel: host,
    typeLabel: type,
    thumbnail: thumb,
    resource_type: type,
    url,
  };
}

function collectAiTopicResources(project: AiPathGenerateResponse | null): AiPathResourceLink[] {
  if (!project) return [];
  const seen = new Set<string>();
  const out: AiPathResourceLink[] = [];
  for (const node of project.data.nodes || []) {
    for (const r of node.resources || []) {
      const url = String(r.url || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ ...r, url });
    }
    for (const sub of node.sub_nodes || []) {
      for (const r of sub.resources || []) {
        const url = String(r.url || "").trim();
        if (!url || seen.has(url)) continue;
        seen.add(url);
        out.push({ ...r, url });
      }
    }
  }
  return out;
}
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
    xiaohongshu: "Xiaohongshu",
    wechat: "WeChat",
    weibo: "Weibo",
    podcast: "Podcast",
    website: "Website",
  };
  return map[platform.toLowerCase()] || platform;
}

function formatMinutes(minutes: number): string {
  if (!minutes) return "Flexible";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function readableType(type: ModuleType): string {
  const map: Record<string, string> = {
    video: "Video",
    document: "Document",
    article: "Article",
    clip: "Clip",
    link: "Link",
    unknown: "Resource",
  };
  return map[type] || "Resource";
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LearningPathDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromMyPaths = searchParams.get("from") === "my-paths";
  const aiProjectIdParam = searchParams.get("ai_project_id");

  const { isAuthed } = useAuth();
  const navigate = useNavigate();

  const [path, setPath] = useState<PublicLearningPathDetail | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiProject, setAiProject] = useState<AiPathGenerateResponse | null>(null);
  const [bannerSrc, setBannerSrc] = useState("");
  const [aiResourceSummaries, setAiResourceSummaries] = useState<LearningPathAiResourceSummaryItem[]>([]);
  const [aiResourceSummariesLoading, setAiResourceSummariesLoading] = useState(false);

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
          stage: it.stage ?? null,
          purpose: it.purpose ?? null,
          estimatedTime: it.estimated_time ?? null,
          resourceData: r,
          manualWeight: (it as any).manual_weight ?? null,
        };
      }).sort((a, b) => a.orderIndex - b.orderIndex);

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

  useEffect(() => {
    const nid = Number(id);
    if (!Number.isFinite(nid) || nid <= 0) return;
    if (!path?.title) return;

    let cancelled = false;

    const resolve = async () => {
      // 1) explicit override
      if (aiProjectIdParam && /^[0-9]+$/.test(aiProjectIdParam)) {
        try {
          const proj = await getAiPathProject(Number(aiProjectIdParam));
          if (!cancelled) setAiProject(proj);
          return;
        } catch {
          // fall through
        }
      }

      // 2) direct link via published_learning_path_id (server fallback may still 404)
      try {
        const proj = await getAiPathProjectByLearningPathId(nid);
        if (!cancelled) setAiProject(proj);
        return;
      } catch {
        // fall through
      }

      // 3) fuzzy match by title against latest ai projects
      try {
        const projects = await listAiPathProjects(50, 0);
        const title = String(path.title || "").trim().toLowerCase();
        const matched =
          projects.find((p) => String(p.topic || "").trim().toLowerCase() === title) ||
          projects.find((p) => String(p.topic || "").trim().toLowerCase().includes(title)) ||
          projects.find((p) => title.includes(String(p.topic || "").trim().toLowerCase()));
        if (!matched) return;
        const proj = await getAiPathProject(matched.id);
        if (!cancelled) setAiProject(proj);
      } catch {
        // ignore
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [id, path?.title, aiProjectIdParam]);

  useEffect(() => {
    const nid = Number(id);
    if (!Number.isFinite(nid) || nid <= 0) return;
    if (!path) return;
    if (fromMyPaths) return; // public endpoint only for now
    if (!modules.length) return;

    let cancelled = false;
    setAiResourceSummariesLoading(true);
    getPublicLearningPathAiResourceSummaries(nid, { limit: modules.length })
      .then((res) => {
        if (cancelled) return;
        setAiResourceSummaries(res.items || []);
      })
      .catch(() => {
        if (cancelled) return;
        setAiResourceSummaries([]);
      })
      .finally(() => {
        if (cancelled) return;
        setAiResourceSummariesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, path, modules.length, fromMyPaths]);

  const aiTopicResources = useMemo(
    () => collectAiTopicResources(aiProject),
    [aiProject]
  );

  const computedBannerSrc = useMemo(() => {
    const aiCover = String(aiProject?.data?.cover_image_url || "").trim();
    if (aiCover) return aiCover;

    const lpCover = String(path?.cover_image_url || "").trim();
    if (lpCover) return lpCover;

    const firstThumb = modules[0] ? moduleThumb(modules[0]) : "";
    if (firstThumb) return firstThumb;

    return FALLBACK_THUMB;
  }, [aiProject?.data?.cover_image_url, path?.cover_image_url, modules]);

  const fallbackBannerSrc = useMemo(() => {
    const firstThumb = modules[0] ? moduleThumb(modules[0]) : "";
    return firstThumb || FALLBACK_THUMB;
  }, [modules]);

  useEffect(() => {
    setBannerSrc(computedBannerSrc);
  }, [computedBannerSrc]);

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

          {/* AI outline (when available) */}
          {aiProject?.project_id ? (
            <section className="rounded-md border border-sky-100 bg-sky-50/60 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">
                    AI Outline + Subnodes
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-stone-950">
                    {aiProject.data.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    {aiProject.data.summary}
                  </p>
                </div>
                <Link
                  to={`/ai-path-detail?project_id=${aiProject.project_id}`}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-sky-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
                >
                  Open AI Reader
                </Link>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-md border border-stone-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                    Chapters
                  </p>
                  <div className="mt-4 space-y-4">
                    {(aiProject.data.nodes || []).slice(0, 6).map((node, idx) => (
                      <div
                        key={`${node.title}-${idx}`}
                        className="rounded-md border border-stone-100 bg-stone-50 p-4"
                      >
                        <p className="text-sm font-black text-stone-950">
                          {idx + 1}. {node.title}
                        </p>
                        {node.description ? (
                          <p className="mt-1 text-xs leading-6 text-stone-500">
                            {node.description}
                          </p>
                        ) : null}
                        {(node.sub_nodes || []).length ? (
                          <ul className="mt-3 space-y-2">
                            {(node.sub_nodes || []).slice(0, 6).map((sub: AiPathSubNode, sidx: number) => (
                              <li
                                key={`${sub.title}-${sidx}`}
                                className="flex items-start gap-2 text-sm leading-6 text-stone-700"
                              >
                                <span className="mt-2 inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                                <span className="line-clamp-2">{sub.title}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-stone-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                    Resources
                  </p>
                  {aiTopicResources.length ? (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {aiTopicResources.slice(0, 6).map((r, ridx) => {
                        const ui = aiPathResourceToUiResource(r, ridx);
                        return (
                          <ResourceCard
                            key={`${r.url}-${ridx}`}
                            resource={ui}
                            onOpen={() => ui.url && window.open(ui.url, "_blank", "noopener,noreferrer")}
                            onAdd={() => {}}
                            saving={false}
                            saved={false}
                            size="sm"
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-stone-500">
                      No AI resources found for this topic yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-md border border-stone-200 bg-white p-4 md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">
                      Resource Path Content Preview
                    </p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-stone-950">
                      How each resource supports this path
                    </h3>
                  </div>
                  {aiResourceSummariesLoading ? (
                    <span className="text-xs text-stone-400">Generating…</span>
                  ) : null}
                </div>

                {aiResourceSummaries.length ? (
                  <div className="mt-5 grid gap-4">
                    {aiResourceSummaries.slice(0, modules.length).map((item) => (
                      <a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-md border border-stone-200 bg-white p-4 transition-colors hover:border-sky-200 hover:bg-sky-50/30"
                      >
                        <div className="grid gap-4 md:grid-cols-[112px_minmax(0,1fr)]">
                          <div className="h-24 w-full overflow-hidden rounded-md border border-stone-200 bg-stone-50 p-1 md:h-20">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="h-full w-full rounded-[3px] object-cover object-center"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-[3px] bg-sky-50 text-2xl font-black text-sky-200">
                                {item.title.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                                {item.resource_type || "resource"}
                              </span>
                              {item.learning_stage ? (
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-500">
                                  {item.learning_stage}
                                </span>
                              ) : null}
                              {item.estimated_minutes ? (
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-500">
                                  {formatMinutes(item.estimated_minutes)}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-base font-black leading-6 text-stone-950">
                              {item.title}
                            </p>
                            <p className="mt-2 text-sm leading-7 text-stone-600">
                              {item.summary}
                            </p>
                            {item.key_points?.length ? (
                              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {item.key_points.slice(0, 4).map((kp) => (
                                  <li
                                    key={kp}
                                    className="flex items-start gap-2 text-xs leading-5 text-stone-600"
                                  >
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                                    <span>{kp}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">
                    {aiResourceSummariesLoading
                      ? "Generating summaries from resources…"
                      : "No summaries yet."}
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {/* Banner */}
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white p-3 shadow-sm">
            <div className="grid gap-5 rounded-[5px] bg-sky-50/60 p-4 md:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] md:items-center md:p-5">
              <div className="flex min-w-0 flex-col justify-between py-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
                      Learning Path
                    </span>
                    {aiProject?.project_id ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 ring-1 ring-stone-100">
                        AI Outline #{String(aiProject.project_id).padStart(3, "0")}
                      </span>
                    ) : null}
                    {path.type ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 ring-1 ring-stone-100">
                        {path.type}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-stone-950 md:text-4xl">
                    {path.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                    {path.description || "A curated learning path with structured references and practical resources."}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                  <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-stone-100">
                    {modules.length} resources
                  </span>
                  {path.category_name ? (
                    <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-stone-100">
                      {path.category_name}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="w-full overflow-hidden rounded-md border border-white/80 bg-white p-1 shadow-sm">
                <img
                  src={bannerSrc || FALLBACK_THUMB}
                  alt={path.title}
                  loading="lazy"
                  decoding="async"
                  onError={() => {
                    if (bannerSrc !== fallbackBannerSrc) setBannerSrc(fallbackBannerSrc);
                  }}
                  className="aspect-[1200/630] h-auto w-full rounded-[3px] object-contain object-center"
                />
              </div>
            </div>
          </div>

          {/* Resources */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium tracking-[0.14em] uppercase text-foreground">
                  Related Resources
                </h2>
                <p className="text-sm text-muted-foreground">
                  {modules.length} resources connected to this topic
                </p>
              </div>
            </div>

            {modules.length ? (
              <div className="space-y-4">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 p-4 rounded-md border border-stone-200 bg-white hover:border-stone-300 transition-colors"
                  >
                    {/* Left: ResourceCard */}
                    <ResourceCard
                      resource={moduleToUiResource(m)}
                      onOpen={() => openResource(m)}
                      onAdd={() => {}}
                      saving={false}
                      saved={false}
                    />

                    {/* Right: Detail */}
                    <div className="flex flex-col justify-start pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          {readableType(m.type)}
                        </span>
                        {m.estimatedTime && (
                          <span className="text-xs text-stone-500">
                            {formatMinutes(m.estimatedTime)}
                          </span>
                        )}
                        <span className="text-xs text-stone-400">·</span>
                        <span className="text-xs text-stone-500">
                          {m.level || "Beginner"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-stone-900 mb-2">
                        {m.title}
                      </h3>

                      <p className="text-sm leading-6 text-stone-600 mb-3">
                        {m.summary || m.purpose || "No summary available."}
                      </p>

                      {m.stage && (
                        <p className="text-xs text-stone-500 mb-3">
                          <span className="font-semibold">Stage:</span> {m.stage}
                        </p>
                      )}

                      <button
                        onClick={() => openResource(m)}
                        className="self-start inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
                      >
                        Open Resource
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
                <p className="text-sm font-semibold text-stone-600">
                  No related resources have been added to this path yet.
                </p>
              </div>
            )}
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
