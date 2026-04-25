import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Download,
  Link as LinkIcon,
  Play,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getMyResourceDetail,
  getResourceDetail,
  type DbResourceDetail,
} from "@/services/resource";
import { getMyProgressForItem, upsertMyProgress } from "@/services/progress";
import { formatPlatform } from "@/lib/platform";

function isYouTubeUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return (
    /youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\//.test(url) ||
    /youtube-nocookie\.com\/embed\//.test(url)
  );
}

function extractYouTubeId(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return u.pathname.replace(/^\//, "").split("/")[0] || "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return parts[1];
      if (parts[0] === "shorts" && parts[1]) return parts[1];
    }
    if (host === "youtube-nocookie.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return parts[1];
    }
  } catch {}
  return "";
}

function toYouTubeEmbed(url: string | undefined | null): string {
  if (!url) return "";
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function ResourceVideo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resource, setResource] = useState<DbResourceDetail | null>(null);

  const [embedUrl, setEmbedUrl] = useState("");
  const [playerFailed, setPlayerFailed] = useState(false);

  const [trackedProgress, setTrackedProgress] = useState(0);
  const [manualProgress, setManualProgress] = useState(0);
  const [progressUpdating, setProgressUpdating] = useState(false);
  const [lastSentProgress, setLastSentProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const pathItemId = (() => {
    // Can't easily access search params without useSearchParams, so we'll read from sessionStorage or URL
    return null;
  })();

  const resourceIdNumber = (() => {
    const raw = String(id || "").trim();
    if (!raw) return null;
    if (!/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();

  const isMy = window.location.pathname.startsWith("/my-resources");

  const publishedText = formatDate(resource?.article?.published_at || null);
  const addedText = formatDate(resource?.created_at || null);

  const videoId = (() => {
    const fromDb = String(resource?.video?.video_id || "").trim();
    if (fromDb) return fromDb;
    const fromUrl = extractYouTubeId(String(resource?.source_url || ""));
    return String(fromUrl || "").trim();
  })();

  const openOnYouTubeUrl = videoId
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    : "";

  useEffect(() => {
    if (!resource?.source_url) return;
    const rawUrl = resource.source_url;
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    if (isYouTubeUrl(rawUrl)) {
      const vid = videoId;
      if (vid) {
        const qs = new URLSearchParams();
        qs.set("rel", "0");
        if (origin) qs.set("origin", origin);
        setEmbedUrl(
          `https://www.youtube.com/embed/${encodeURIComponent(
            vid
          )}?${qs.toString()}`
        );
      } else {
        const base = toYouTubeEmbed(rawUrl);
        setEmbedUrl(base);
      }
    } else {
      setEmbedUrl(rawUrl || "");
    }
  }, [resource?.source_url, videoId]);

  async function seedProgressFromServer() {
    if (!pathItemId) return;
    try {
      const row = await getMyProgressForItem(pathItemId as number);
      setTrackedProgress(Number(row?.progress_percentage) || 0);
      setManualProgress(Number(row?.progress_percentage) || 0);
    } catch {
      setTrackedProgress(0);
      setManualProgress(0);
    }
    setLastSentProgress(trackedProgress);
  }

  function stopProgressTimer() {
    if (progressTimerRef.current != null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  async function startProgressTimer() {
    stopProgressTimer();
    if (!pathItemId || !ytPlayerRef.current) return;

    await seedProgressFromServer();

    progressTimerRef.current = window.setInterval(async () => {
      if (!ytPlayerRef.current) return;
      if (progressUpdating) return;

      let duration = 0;
      try {
        const d = Number(ytPlayerRef.current.getDuration?.());
        duration = Number.isFinite(d) ? d : 0;
      } catch {
        duration = 0;
      }
      if (!duration) {
        const fallback = Number(resource?.video?.duration);
        duration = Number.isFinite(fallback) ? fallback : 0;
      }
      if (!duration) return;

      let current = 0;
      try {
        const c = Number(ytPlayerRef.current.getCurrentTime?.());
        current = Number.isFinite(c) ? c : 0;
      } catch {
        current = 0;
      }

      const pct = Math.min(
        100,
        Math.max(0, Math.round((current / duration) * 100))
      );
      if (pct <= lastSentProgress) return;

      setProgressUpdating(true);
      try {
        setTrackedProgress(pct);
        setManualProgress(pct);
        setLastSentProgress(pct);
        await upsertMyProgress({
          path_item_id: pathItemId as number,
          progress_percentage: pct,
        });
      } catch {
        // ignore
      } finally {
        setProgressUpdating(false);
      }
    }, 10_000);
  }

  async function load() {
    setError("");
    setLoading(true);
    try {
      const dbId = resourceIdNumber;
      if (dbId == null) throw new Error("Invalid resource id");

      const data = isMy
        ? await getMyResourceDetail(dbId)
        : await getResourceDetail(dbId);
      setResource(data);

      if (isYouTubeUrl(data.source_url)) {
        setPlayerFailed(false);
      }
    } catch (e: any) {
      setError(
        String(
          e?.response?.data?.detail || e?.message || "Failed to load resource"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (resourceIdNumber != null) {
      load();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      stopProgressTimer();
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {}
      ytPlayerRef.current = null;
    };
  }, []);

  function openSource() {
    const url = String(resource?.source_url || "").trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openOnYouTube() {
    if (!openOnYouTubeUrl) return;
    window.open(openOnYouTubeUrl, "_blank", "noopener,noreferrer");
  }

  function goSaveToPath() {
    if (!id) return;
    navigate(`/resources/video/${id}/add-to-path`);
  }

  async function updateManualProgress() {
    if (!pathItemId) return;
    if (progressUpdating) return;

    let pct = Math.round(Number(manualProgress) || 0);
    pct = Math.max(0, Math.min(100, pct));
    setManualProgress(pct);

    if (pct === trackedProgress) return;

    setProgressUpdating(true);
    try {
      setTrackedProgress(pct);
      setLastSentProgress(pct);
      await upsertMyProgress({
        path_item_id: pathItemId as number,
        progress_percentage: pct,
      });
    } catch (e) {
      console.error("Failed to update progress:", e);
      setManualProgress(trackedProgress);
    } finally {
      setProgressUpdating(false);
    }
  }

  async function markComplete() {
    if (!pathItemId) return;
    if (progressUpdating) return;
    setProgressUpdating(true);
    try {
      setTrackedProgress(100);
      setManualProgress(100);
      setLastSentProgress(100);
      await upsertMyProgress({
        path_item_id: pathItemId as number,
        progress_percentage: 100,
      });
    } catch {
    } finally {
      setProgressUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
        <Card className="p-6">
          <div className="text-sm text-stone-400">Loading…</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
        <Card className="p-6">
          <div className="text-sm text-red-500">{error}</div>
        </Card>
      </div>
    );
  }

  if (!resource) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <section className="border-b border-stone-100 pb-8">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">
              Video
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
              Watch and track your progress.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <Card className="bg-black overflow-hidden p-0">
          <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 h-full w-full"
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/80">
                Video preview is unavailable
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-stone-900">
            {resource.title}
          </h2>

          {pathItemId != null && (
            <div className="rounded-md border border-stone-100 bg-stone-50/50 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-stone-500">Learning Progress</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={manualProgress}
                    onChange={(e) => setManualProgress(Number(e.target.value))}
                    onKeyUp={(e) => e.key === "Enter" && updateManualProgress()}
                    min={0}
                    max={100}
                    className="w-16 h-8 px-2 text-sm border border-stone-200 rounded bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                  <span className="font-semibold text-stone-900">%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 rounded-sm"
                    disabled={
                      progressUpdating || manualProgress === trackedProgress
                    }
                    onClick={updateManualProgress}
                  >
                    Update
                  </Button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  value={manualProgress}
                  onChange={(e) => setManualProgress(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full h-2 bg-stone-100 rounded-sm appearance-none cursor-pointer"
                  style={{ accentColor: "hsl(12, 6%, 16%)" }}
                />
                <div className="mt-1 flex justify-between text-xs text-stone-400">
                  <span>0%</span>
                  <span className="text-stone-700 font-medium">
                    {trackedProgress}% saved
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
              {resource.video?.channel && (
                <span className="inline-flex items-center gap-2 rounded-md border border-stone-100 bg-stone-50/50 px-3 py-1">
                  <UserRound className="h-4 w-4" />
                  {resource.video.channel}
                </span>
              )}
              {publishedText && (
                <span className="inline-flex items-center gap-2 rounded-md border border-stone-100 bg-stone-50/50 px-3 py-1">
                  <Calendar className="h-4 w-4" />
                  {publishedText}
                </span>
              )}
              {addedText && (
                <span className="inline-flex items-center gap-2 rounded-md border border-stone-100 bg-stone-50/50 px-3 py-1">
                  <Clock className="h-4 w-4" />
                  Added {addedText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-sm"
                onClick={goSaveToPath}
              >
                Save to path
              </Button>
              {openOnYouTubeUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-sm"
                  onClick={openOnYouTube}
                >
                  Open on YouTube
                </Button>
              )}
              {pathItemId != null && (
                <Button
                  size="sm"
                  className="rounded-sm bg-stone-900 text-white hover:bg-stone-800"
                  disabled={progressUpdating}
                  onClick={markComplete}
                >
                  Mark as complete
                </Button>
              )}
              <Button
                size="icon"
                variant="outline"
                className="rounded-sm"
                aria-label="Open source URL"
                onClick={openSource}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Description
              </h3>
              <p className="text-sm text-stone-500 whitespace-pre-wrap leading-relaxed">
                {resource.summary || "—"}
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-stone-900 mb-2">Source</h3>
              <div className="space-y-2 text-sm text-stone-500">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-stone-400 shrink-0" />
                  {resource.source_url ? (
                    <a
                      href={resource.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-700 underline underline-offset-4 break-all"
                    >
                      {resource.source_url}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Platform:</span>
                  <span className="font-medium text-stone-700">
                    {formatPlatform(resource.platform)}
                  </span>
                </div>
                {resource.video?.duration && (
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Duration:</span>
                    <span className="font-medium text-stone-700">
                      {Math.floor(resource.video.duration / 60)}:
                      {String(resource.video.duration % 60).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
