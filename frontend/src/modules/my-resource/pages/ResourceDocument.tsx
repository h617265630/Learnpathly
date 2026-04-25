import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getMyResourceDetail,
  getResourceDetail,
  type DbResourceDetail,
} from "@/services/resource";
import { formatPlatform } from "@/lib/platform";
import request from "@/services/request";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function canPreview(url: string | undefined): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith(".pdf")) return true;
  if (
    lowerUrl.endsWith(".doc") ||
    lowerUrl.endsWith(".docx") ||
    lowerUrl.endsWith(".xls") ||
    lowerUrl.endsWith(".xlsx") ||
    lowerUrl.endsWith(".ppt") ||
    lowerUrl.endsWith(".pptx")
  )
    return true;
  return false;
}

function viewerUrl(url: string | undefined): string {
  if (!url) return "";
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.endsWith(".pdf")) {
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
      url
    )}`;
  }

  if (
    lowerUrl.endsWith(".doc") ||
    lowerUrl.endsWith(".docx") ||
    lowerUrl.endsWith(".xls") ||
    lowerUrl.endsWith(".xlsx") ||
    lowerUrl.endsWith(".ppt") ||
    lowerUrl.endsWith(".pptx")
  ) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      url
    )}`;
  }

  return "";
}

export default function ResourceDocument() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resource, setResource] = useState<DbResourceDetail | null>(null);

  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState("");
  const [readerHtml, setReaderHtml] = useState("");
  const [readerScrollRef, setReaderScrollRef] = useState<HTMLDivElement | null>(
    null
  );
  const [trackedProgress, setTrackedProgress] = useState(0);
  const [progressUpdating, setProgressUpdating] = useState(false);
  const [lastSentProgress, setLastSentProgress] = useState(0);
  let progressTimer: number | null = null;
  let lastTickAt = 0;
  const [readingActiveSeconds, setReadingActiveSeconds] = useState(0);
  const [externalTrackingStartAt, setExternalTrackingStartAt] = useState<
    number | null
  >(null);
  const [externalTrackingArmed, setExternalTrackingArmed] = useState(false);

  const pathItemId = (() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("path_item_id") || "";
    if (!raw) return null;
    if (!/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();

  const isMy = window.location.pathname.startsWith("/my-resources");

  const resourceIdNumber = (() => {
    const raw = String(id || "").trim();
    if (!raw) return null;
    if (!/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();

  const createdText = formatDate(resource?.created_at || null);
  const publishedText = formatDate(resource?.article?.published_at || null);
  const updatedText = publishedText || createdText;

  const canPreviewDoc = canPreview(resource?.source_url);
  const docViewerUrl = viewerUrl(resource?.source_url);

  function stopProgressTimer() {
    if (progressTimer != null) {
      window.clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function stopExternalTracking() {
    setExternalTrackingArmed(false);
    setExternalTrackingStartAt(null);
  }

  function estimateReadingSeconds() {
    const wc = 0;
    if (wc > 0) {
      return Math.max(60, Math.round((wc / 220) * 60));
    }
    return 8 * 60;
  }

  function computeScrollPct() {
    const el = readerScrollRef;
    if (!el) return 0;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((el.scrollTop / max) * 100)));
  }

  async function maybeSendProgress(next: number) {
    const pid = pathItemId;
    if (pid == null) return;
    if (progressUpdating) return;
    const n = Math.min(95, Math.max(0, Math.round(next)));
    if (n <= lastSentProgress) return;
    setProgressUpdating(true);
    try {
      setTrackedProgress(n);
      setLastSentProgress(n);
    } catch {
    } finally {
      setProgressUpdating(false);
    }
  }

  async function startProgressTimer() {
    stopProgressTimer();
    if (pathItemId == null) return;

    setReadingActiveSeconds(0);
    lastTickAt = Date.now();
    progressTimer = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      if (!readerHtml) return;
      const now = Date.now();
      const delta = Math.max(0, Math.round((now - lastTickAt) / 1000));
      lastTickAt = now;
      setReadingActiveSeconds((prev) => prev + delta);
      const scrollPct = computeScrollPct();
      const timePct = Math.min(
        95,
        Math.round((readingActiveSeconds / estimateReadingSeconds()) * 100)
      );
      await maybeSendProgress(Math.max(scrollPct, timePct));
    }, 5_000);
  }

  function openSource(track = false) {
    const url = String(resource?.source_url || "").trim();
    if (!url) return;
    if (track) {
      setExternalTrackingStartAt(Date.now());
      setExternalTrackingArmed(true);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function onVisibilityChange() {
    if (document.visibilityState !== "visible") return;
    if (!externalTrackingArmed) return;
    const startAt = externalTrackingStartAt;
    stopExternalTracking();
    if (!startAt) return;
    const minutes = Math.round((Date.now() - startAt) / 60_000);
    if (minutes <= 0) return;
    if (pathItemId == null) return;
    const ok = window.confirm(
      `Record ${minutes} minutes of reading to your learning progress?`
    );
    if (!ok) return;
    const inc = Math.min(30, minutes * 5);
    void maybeSendProgress(Math.min(95, trackedProgress + inc));
  }

  async function loadReader() {
    setReaderError("");
    setReaderHtml("");
    if (canPreviewDoc) return;
    const url = String(resource?.source_url || "").trim();
    if (!url) return;
    setReaderLoading(true);
    try {
      const data = await request.post<any, any>("/reader/extract", { url });
      const html = String(data?.content_html || "").trim();
      setReaderHtml(html);
      if (html && pathItemId != null) {
        await startProgressTimer();
      }
    } catch (e: any) {
      setReaderError(
        String(
          e?.response?.data?.detail || e?.message || "Reader extract failed"
        )
      );
    } finally {
      setReaderLoading(false);
    }
  }

  async function markComplete() {
    const pid = pathItemId;
    if (pid == null) return;
    if (progressUpdating) return;
    setProgressUpdating(true);
    try {
      setTrackedProgress(100);
      setLastSentProgress(100);
    } catch {
    } finally {
      setProgressUpdating(false);
    }
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
      await loadReader();
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
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stopProgressTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [id]);

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
              Document
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
              Preview or read the document and track progress.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-stone-400">
            Document Resource
          </p>
          <h2 className="text-2xl font-semibold text-stone-900 md:text-3xl">
            {resource.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-stone-100 bg-stone-50/50">
              <FileText className="w-4 h-4" />
              {resource.resource_type}
            </span>
            {resource.platform && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-stone-100 bg-stone-50/50">
                <Sparkles className="w-4 h-4" />
                {formatPlatform(resource.platform)}
              </span>
            )}
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-stone-100 bg-stone-50/50">
              {updatedText ? `Updated ${updatedText}` : "—"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="overflow-hidden p-0">
            {/* Document Viewer */}
            {canPreviewDoc && (
              <div className="w-full bg-slate-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2 text-sm text-stone-700">
                    <FileText className="w-4 h-4" />
                    <span>Document Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="rounded-sm bg-stone-900 text-white hover:bg-stone-800"
                      onClick={() => openSource()}
                    >
                      Open in new tab
                    </Button>
                    {pathItemId != null && (
                      <Button
                        size="sm"
                        className="rounded-sm"
                        variant="outline"
                        disabled={progressUpdating}
                        onClick={markComplete}
                      >
                        Mark as complete
                      </Button>
                    )}
                  </div>
                </div>
                <div className="w-full" style={{ height: 600 }}>
                  {docViewerUrl ? (
                    <iframe
                      src={docViewerUrl}
                      className="w-full h-full border-0"
                      title="Document viewer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <div className="text-center space-y-2">
                        <FileText className="w-12 h-12 mx-auto" />
                        <p>Unable to preview this document</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fallback: Thumbnail + Summary */}
            {!canPreviewDoc && (
              <>
                {resource.thumbnail ? (
                  <div className="w-full h-64 bg-slate-100 overflow-hidden">
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white/80" />
                  </div>
                )}
              </>
            )}

            {/* Content */}
            <div className="p-6 space-y-6">
              {pathItemId != null && (
                <div className="rounded-md border border-stone-100 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-stone-700">
                      Learning Progress
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      {trackedProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2">
                    <div
                      className="h-2 rounded-md transition-all duration-300 bg-stone-900"
                      style={{ width: `${trackedProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-stone-400">
                    <span>
                      {trackedProgress >= 100
                        ? "Completed"
                        : trackedProgress > 0
                        ? "In progress"
                        : "Not started"}
                    </span>
                    {trackedProgress < 100 && (
                      <span>Continue reading to update progress</span>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              {resource.summary && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-stone-900">
                    Summary
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-wrap">
                    {resource.summary}
                  </p>
                </div>
              )}

              {/* Reader Mode fallback */}
              {!canPreviewDoc && (
                <div className="rounded-md border border-stone-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-stone-50/50 border-b border-stone-100">
                    <div className="text-sm font-semibold text-stone-700">
                      Reader Mode
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-sm"
                        disabled={!resource.source_url}
                        onClick={() => openSource(true)}
                      >
                        Open Original
                      </Button>
                      {pathItemId != null && (
                        <Button
                          size="sm"
                          className="rounded-sm"
                          variant="outline"
                          disabled={progressUpdating}
                          onClick={markComplete}
                        >
                          Mark as complete
                        </Button>
                      )}
                    </div>
                  </div>
                  {readerLoading && (
                    <div className="p-6 text-stone-400">Loading…</div>
                  )}
                  {readerHtml && (
                    <div
                      ref={setReaderScrollRef}
                      className="p-6 max-h-[70vh] overflow-y-auto prose prose-stone max-w-none"
                    >
                      <div dangerouslySetInnerHTML={{ __html: readerHtml }} />
                    </div>
                  )}
                  {!readerLoading && !readerHtml && (
                    <div className="p-6">
                      <div className="bg-stone-50/50 border border-stone-100 rounded-md p-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-stone-900 mb-2">
                              In-site reading unavailable
                            </h3>
                            <p className="text-stone-500 text-sm mb-4">
                              {readerError ||
                                "This link cannot extract content. You can still open the original and track progress when you return."}
                            </p>
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                className="rounded-sm"
                                disabled={!resource.source_url}
                                onClick={() => openSource(true)}
                              >
                                View on{" "}
                                {formatPlatform(resource.platform) ||
                                  "Original site"}
                              </Button>
                              {pathItemId != null && (
                                <Button
                                  size="sm"
                                  className="rounded-sm"
                                  variant="outline"
                                  disabled={progressUpdating}
                                  onClick={markComplete}
                                >
                                  Mark as complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-stone-900 mb-2">Meta</h3>
              <div className="space-y-2 text-sm text-stone-500">
                <div className="flex items-start gap-2">
                  <LinkIcon className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
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
                  <GraduationCap className="w-4 h-4 text-stone-400" />
                  <span>Platform {formatPlatform(resource.platform)}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 rounded-md bg-stone-50 border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-400">Created</span>
                  <span className="font-semibold text-stone-700">
                    {createdText || "—"}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-stone-50 border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-400">Published</span>
                  <span className="font-semibold text-stone-700">
                    {publishedText || "—"}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  className="flex-1 rounded-sm bg-stone-900 text-white hover:bg-stone-800"
                  onClick={() =>
                    navigate(`/resources/document/${id}/add-to-path`)
                  }
                >
                  Add to path
                </Button>
                {pathItemId != null && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-sm"
                    disabled={progressUpdating}
                    onClick={markComplete}
                  >
                    Mark as complete
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-sm"
                  onClick={() => openSource()}
                  disabled={!resource.source_url}
                >
                  Open
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
