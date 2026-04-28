import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  searchAiResources,
  getCachedResults,
  type AiResourceItem,
} from "@/services/aiPath";
import { createMyResourceFromUrl } from "@/services/resource";
import { ResourceCard, type UiResource } from "@/components/ResourceCard";
import { ResourceDetailModal } from "@/components/ui/ResourceDetailModal";
import { Button } from "@/components/ui/Button";

// ── LocalStorage ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "learnsmart_recent_searches_v1";
const MAX_RECENT = 8;

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(topics: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics.slice(0, MAX_RECENT)));
  } catch {}
}

// ── Helpers ────────────────────────────────────────────────────────

function resourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "resource";
  }
}

// ── AiResourceItem → UiResource 转换 ────────────────────────────────────────

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

function aiItemToUiResource(item: AiResourceItem, _idx: number): UiResource {
  const id = Math.abs(
    item.url.split("").reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)
  );

  // thumbnail: 优先 item.image，其次 GitHub opengraph，最后 fallback
  let thumbnail = item.image || "";
  if (!thumbnail && item.url.includes("github.com")) {
    try {
      const parts = new URL(item.url).pathname.replace(/^\//, "").split("/");
      if (parts.length >= 2) {
        thumbnail = `https://opengraph.githubassets.com/1/${parts[0]}/${parts[1]}`;
      }
    } catch {}
  }
  // Fallback to favicon or placeholder
  if (!thumbnail) {
    try {
      const host = new URL(item.url).hostname;
      thumbnail = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=256`;
    } catch {
      thumbnail = FALLBACK_THUMB;
    }
  }

  return {
    id,
    title: item.title,
    summary: item.description,
    categoryLabel: item.learning_stage || "Resource",
    categoryColor: "#f59e0b",
    platform: item.url.includes("github.com") ? "github" : "web",
    platformLabel: item.url.includes("github.com")
      ? new URL(item.url).hostname.replace(/^www\./, "")
      : resourceHost(item.url),
    typeLabel: item.resource_type || "repo",
    thumbnail,
    resource_type: item.resource_type,
    url: item.url,
  };
}

// ── Presets ────────────────────────────────────────────────────────

const presets = [
  "React hooks best practices",
  "Python async programming",
  "Machine learning fundamentals",
  "TypeScript advanced types",
  "openclaw",
  "claude code",
];

// ── Component ─────────────────────────────────────────────────────

export default function AIRsource() {
  const [query, setQuery] = useState("");
  const [githubResults, setGithubResults] = useState<AiResourceItem[]>([]);
  const [webResults, setWebResults] = useState<AiResourceItem[]>([]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCached, setLoadingCached] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [activeResource, setActiveResource] = useState<UiResource | null>(null);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState("");

  // Track all displayed URLs for shuffle deduplication
  const displayedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  const addRecentSearch = useCallback((t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, MAX_RECENT);
      saveRecentSearches(next);
      return next;
    });
  }, []);

  const doSearch = useCallback(
    async (q: string, excludeUrls: string[] = []) => {
      setLoading(true);
      setError("");
      setIsCachedResult(false);
      try {
        const resp = await searchAiResources(q, excludeUrls);

        // Collect all URLs from this response
        const allUrls = [
          ...(resp.github_results || []).map((r) => r.url),
          ...(resp.data || []).map((r) => r.url),
        ];

        // Shuffle landed in nothing new — retry fresh and warn
        if (excludeUrls.length > 0 && allUrls.length === 0) {
          const freshResp = await searchAiResources(q, []);
          setGithubResults(freshResp.github_results || []);
          setWebResults(freshResp.data || []);
          setTopic(freshResp.topic);
          setSearched(true);
          const freshUrls = [
            ...(freshResp.github_results || []).map((r) => r.url),
            ...(freshResp.data || []).map((r) => r.url),
          ];
          displayedUrlsRef.current = new Set(freshUrls);
          setError("Not enough new resources found — showing fresh results instead.");
        } else {
          setGithubResults(resp.github_results || []);
          setWebResults(resp.data || []);
          setTopic(resp.topic);
          setSearched(true);

          if (excludeUrls.length === 0) {
            displayedUrlsRef.current = new Set(allUrls);
          } else {
            for (const u of allUrls) displayedUrlsRef.current.add(u);
          }
        }

        addRecentSearch(q);
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        setError(
          String(
            err.response?.data?.detail ||
              err.message ||
              "Search failed"
          )
        );
        setGithubResults([]);
        setWebResults([]);
      } finally {
        setLoading(false);
      }
    },
    [addRecentSearch]
  );

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    void doSearch(q, []);
  }, [query, doSearch]);

  // Shuffle: re-search excluding all currently shown URLs
  const handleShuffle = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const exclude = Array.from(displayedUrlsRef.current);
    void doSearch(q, exclude);
  }, [query, doSearch]);

  const handleLoadCached = useCallback(async (t: string) => {
    setLoadingCached(true);
    setError("");
    setIsCachedResult(true);
    setQuery(t);
    try {
      const resp = await getCachedResults(t);
      // Cached results don't distinguish github vs web, put all in web
      setGithubResults([]);
      setWebResults(resp.data || []);
      setTopic(resp.topic);
      setSearched(true);
      displayedUrlsRef.current = new Set(resp.data.map((r) => r.url));
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      setError(
        String(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load cached results"
        )
      );
      setGithubResults([]);
      setWebResults([]);
    } finally {
      setLoadingCached(false);
    }
  }, []);

  const removeRecent = useCallback((t: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== t);
      saveRecentSearches(next);
      return next;
    });
  }, []);

  const handleSave = useCallback(async (resource: UiResource) => {
    if (!resource.url || savingIds.has(resource.id) || savedIds.has(resource.id)) return;
    setSavingIds((prev) => new Set(prev).add(resource.id));
    setSaveError("");
    try {
      await createMyResourceFromUrl(resource.url, { manual_weight: 100 });
      setSavedIds((prev) => new Set(prev).add(resource.id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setSaveError(String(err.response?.data?.detail || err.message || "Failed to save"));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(resource.id);
        return next;
      });
    }
  }, [savingIds, savedIds]);

  const totalResults = githubResults.length + webResults.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-500 mb-4 block">
              AI Guided
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
              AI Resource <span className="text-sky-500">Search</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-stone-500 leading-relaxed">
              Enter any learning topic and AI will search the web for the most relevant tutorials, articles, videos and docs — summarised and ready to explore.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Search input */}
        <section className="bg-white rounded-md border border-stone-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                Search
              </p>
              <h2 className="mt-1 text-base sm:text-lg font-semibold text-stone-900">
                What do you want to learn about?
              </h2>
            </div>
            <Link
              to="/ai-path"
              className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              Or generate a full path →
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Kubernetes, React performance, SQL optimization"
              className="flex-1 border border-stone-200 rounded-md bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-50"
            />
            <Button
              type="button"
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-sky-500 text-white px-5 py-2.5 text-sm font-semibold rounded-md hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Presets */}
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setQuery(p)}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-500 transition-all hover:border-sky-300 hover:text-sky-600"
              >
                {p}
              </button>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>}
        </section>

        {/* Results */}
        {searched && (
          <section className="mt-8">
            {/* Result header */}
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                  {isCachedResult ? "Cached" : "Results"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-stone-900">
                  {topic}
                  <span className="ml-2 text-sm font-normal text-stone-400">
                    — {totalResults} resources found
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {isCachedResult && (
                  <span className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-[10px] font-medium text-stone-500">
                    from cache
                  </span>
                )}
                {!isCachedResult && totalResults > 0 && (
                  <button
                    type="button"
                    onClick={handleShuffle}
                    disabled={loading}
                    className="flex items-center gap-2 border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 rounded-lg transition-all hover:border-stone-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                    </svg>
                    Shuffle
                  </button>
                )}
              </div>
            </div>

            {/* GitHub Results — top section */}
            {githubResults.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2">
                  <svg className="h-4 w-4 text-stone-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-stone-900">GitHub Repositories</h4>
                  <span className="text-xs text-stone-400">{githubResults.length} results</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {githubResults.map((item, idx) => {
                    const ui = aiItemToUiResource(item, idx);
                    return (
                      <ResourceCard
                        key={`gh-${item.url}-${idx}`}
                        resource={ui}
                        onOpen={() => setActiveResource(ui)}
                        onAdd={() => {}}
                        saving={false}
                        saved={false}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            {githubResults.length > 0 && webResults.length > 0 && (
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-stone-100" />
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  Web Resources
                </span>
                <div className="h-px flex-1 bg-stone-100" />
              </div>
            )}

            {/* Web Results — bottom section */}
            {webResults.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xs text-stone-400">{webResults.length} results</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {webResults.map((item, idx) => {
                    const ui = aiItemToUiResource(item, idx);
                    return (
                      <ResourceCard
                        key={`web-${item.url}-${idx}`}
                        resource={ui}
                        onOpen={() => setActiveResource(ui)}
                        onAdd={() => {}}
                        saving={false}
                        saved={false}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {totalResults === 0 && !loading && (
              <div className="rounded-lg border border-stone-200 bg-white px-6 py-16 text-center">
                <p className="text-stone-500">No resources found. Try a different topic.</p>
              </div>
            )}
          </section>
        )}

        {/* Recent Searches + Empty state */}
        {!searched && (
          <>
            {recentSearches.length > 0 && (
              <section className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                      Recent
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-stone-900">
                      Recent Searches
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((t) => (
                    <div
                      key={t}
                      className="group flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 hover:border-sky-300 hover:text-sky-600 transition-colors cursor-pointer"
                      role="button"
                      onClick={() => void handleLoadCached(t)}
                      title="Load from cache"
                    >
                      <span className="text-xs">🔁</span>
                      <span className="text-xs font-medium">{t}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(t);
                        }}
                        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                        aria-label={`Remove ${t}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {loadingCached && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-stone-400">
                    <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    Loading from cache...
                  </div>
                )}
              </section>
            )}

            <section className="mt-8 rounded-lg border border-stone-200 bg-white px-6 py-16 text-center">
              <p className="text-stone-500">
                {recentSearches.length > 0
                  ? "Click a recent search to load cached results, or enter a new topic above."
                  : "Enter a topic above to discover curated learning resources."}
              </p>
            </section>
          </>
        )}
      </main>

      {/* Detail modal */}
      {activeResource && (
        <ResourceDetailModal
          resource={activeResource}
          onClose={() => { setActiveResource(null); setSaveError(""); }}
          onSave={() => handleSave(activeResource)}
          saving={savingIds.has(activeResource.id)}
          saved={savedIds.has(activeResource.id)}
          error={saveError}
        />
      )}
    </div>
  );
}
