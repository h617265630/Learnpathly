import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createMyResourceFromUrl,
  extractVideoMetadata,
  searchResources,
  type UrlExtractResponse,
  type SearchResultItem,
} from "@/services/resource";
import { listCategories, type Category } from "@/services/category";
import { Button } from "@/components/ui/Button";
import { CategoryCreateModal } from "@/components/ui/CategoryCreateModal";
import {
  ResourceCard,
  type UiResource as RcResource,
} from "@/components/ResourceCard";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

const SUPPORTED_PLATFORMS = [
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X" },
  { key: "instagram", label: "Instagram" },
  { key: "github", label: "GitHub" },
  { key: "medium", label: "Medium" },
  { key: "substack", label: "Substack" },
  { key: "devto", label: "Dev.to" },
  { key: "other", label: "Other" },
];

const PLATFORM_PLACEHOLDERS: Record<string, string> = {
  youtube: "https://www.youtube.com/watch?v=...",
  x: "https://x.com/user/status/id",
  instagram: "https://www.instagram.com/p/...",
  github: "https://github.com/...",
  medium: "https://medium.com/.../...",
  substack: "https://xxx.substack.com/p/...",
  devto: "https://dev.to/.../...",
  other: "Paste a URL",
};

const WEIGHT_OPTIONS = [
  // Tier (1-4)
  { value: "tier-gold", label: "Tier Gold" },
  { value: "tier-diamond", label: "Tier Diamond" },
  { value: "tier-prismatic", label: "Tier Prismatic" },
  { value: "tier-obsidian", label: "Tier Obsidian" },
  // Gradient (5-9)
  { value: "gradient-emerald", label: "Gradient Emerald" },
  { value: "gradient-sapphire", label: "Gradient Sapphire" },
  { value: "gradient-ruby", label: "Gradient Ruby" },
  { value: "gradient-amethyst", label: "Gradient Amethyst" },
  { value: "gradient-gold", label: "Gradient Gold" },
  // Special styles
  { value: "neu", label: "Neumorphism" },
  { value: "holo", label: "Holographic" },
  { value: "sketch", label: "Sketch" },
  { value: "newspaper", label: "Newspaper" },
  // Neon styles
  { value: "neon-cyan", label: "Neon Cyan" },
  { value: "neon-pink", label: "Neon Pink" },
  { value: "neon-green", label: "Neon Green" },
  { value: "neon-purple", label: "Neon Purple" },
  { value: "neon-gold", label: "Neon Gold" },
  // Metallic styles
  { value: "metallic-steel", label: "Metallic Steel" },
  { value: "metallic-copper", label: "Metallic Copper" },
  { value: "metallic-titanium", label: "Metallic Titanium" },
  { value: "metallic-rose-gold", label: "Metallic Rose Gold" },
  { value: "metallic-gunmetal", label: "Metallic Gunmetal" },
  // Papercut styles
  { value: "papercut-coral", label: "Papercut Coral" },
  { value: "papercut-sky", label: "Papercut Sky" },
  { value: "papercut-mint", label: "Papercut Mint" },
  { value: "papercut-lavender", label: "Papercut Lavender" },
  { value: "papercut-peach", label: "Papercut Peach" },
  // Default
  { value: "default", label: "Default" },
];

function detectPlatformFromUrl(url: string) {
  const u = String(url || "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("x.com") || u.includes("twitter.com")) return "x";
  if (u.includes("github.com")) return "github";
  if (u.includes("medium.com")) return "medium";
  if (u.includes("substack.com")) return "substack";
  if (u.includes("dev.to")) return "devto";
  return "";
}

function toManualWeight(w: string): number {
  const weightMap: Record<string, number> = {
    // Tier (1-4)
    "tier-gold": 1,
    "tier-diamond": 2,
    "tier-prismatic": 3,
    "tier-obsidian": 4,
    // Gradient (5-9)
    "gradient-emerald": 5,
    "gradient-sapphire": 6,
    "gradient-ruby": 7,
    "gradient-amethyst": 8,
    "gradient-gold": 9,
    // Special (10-13)
    neu: 10,
    holo: 11,
    sketch: 12,
    newspaper: 13,
    // Neon (14-18)
    "neon-cyan": 14,
    "neon-pink": 15,
    "neon-green": 16,
    "neon-purple": 17,
    "neon-gold": 18,
    // Metallic (19-23)
    "metallic-steel": 19,
    "metallic-copper": 20,
    "metallic-titanium": 21,
    "metallic-rose-gold": 22,
    "metallic-gunmetal": 23,
    // Papercut (24-28)
    "papercut-coral": 24,
    "papercut-sky": 25,
    "papercut-mint": 26,
    "papercut-lavender": 27,
    "papercut-peach": 28,
    default: 100,
  };
  return weightMap[w] ?? 100;
}

function formatExtractDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function getErrorMessage(e: any, fallback: string) {
  const detail = e?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    return first && (first.msg || first.message)
      ? String(first.msg || first.message)
      : "";
  }
  return e?.message || fallback;
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

export default function AddResource() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [urlInput, setUrlInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractedMeta, setExtractedMeta] = useState<UrlExtractResponse | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("default");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastText, setSuccessToastText] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const extractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchPlatform, setSearchPlatform] = useState<"github" | "youtube">("github");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  const handleSearch = async () => {
    const q = String(searchQuery || "").trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await searchResources(q, searchPlatform);
      setSearchResults(res.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchResultClick = (url: string) => {
    setUrlInput(url);
  };

  function handleCategoryCreated(category: Category) {
    setDbCategories((prev) => [...prev, category]);
    setCategoryId(String(category.id));
  }

  const selectedPlatformLabel =
    SUPPORTED_PLATFORMS.find((p) => p.key === selectedPlatform)?.label || "";
  const selectedPlatformPlaceholder =
    PLATFORM_PLACEHOLDERS[selectedPlatform] || "Paste a URL";

  const previewResource: RcResource = {
    id: 0,
    title: extractedMeta?.title || "Untitled",
    summary: extractedMeta?.description || "No description",
    categoryLabel:
      dbCategories.find((c) => c.id === Number(categoryId))?.name || "Other",
    categoryColor: getCategoryColor(
      dbCategories.find((c) => c.id === Number(categoryId))?.name || "Other"
    ),
    platform: selectedPlatform,
    platformLabel: selectedPlatformLabel || "video",
    typeLabel: selectedPlatformLabel.toLowerCase() || "video",
    thumbnail: extractedMeta?.thumbnail_url || FALLBACK_THUMB,
    resource_type: selectedPlatformLabel.toLowerCase() || "video",
  };

  // Load categories on mount
  useEffect(() => {
    listCategories()
      .then((cats) => {
        setDbCategories(cats || []);
        const other = cats?.find(
          (c) => String(c.code).toLowerCase() === "other"
        );
        if (other && !categoryId) setCategoryId(String(other.id));
      })
      .catch(() => setDbCategories([]));
  }, []);

  // Apply prefilled URL from query params
  useEffect(() => {
    const q = searchParams.get("url");
    const next = Array.isArray(q)
      ? String(q[0] || "").trim()
      : String(q || "").trim();
    if (!next) return;
    setUrlInput(next);
    const detected = detectPlatformFromUrl(next);
    if (detected) setSelectedPlatform(detected);
  }, []);

  // Auto-extract metadata when URL changes
  useEffect(() => {
    setExtractError("");
    setExtractedMeta(null);
    if (extractTimerRef.current) {
      clearTimeout(extractTimerRef.current);
      extractTimerRef.current = null;
    }
    const raw = String(urlInput || "").trim();
    if (!raw) {
      setExtracting(false);
      return;
    }
    setExtracting(true);
    extractTimerRef.current = setTimeout(() => {
      extractVideoMetadata(raw)
        .then((res) => {
          setExtractedMeta(res);
          setExtracting(false);
        })
        .catch((err) => {
          setExtractError(
            selectedPlatform === "other"
              ? "Not supported yet."
              : getErrorMessage(err, "Parse failed")
          );
          setExtracting(false);
        });
    }, 1200);
  }, [urlInput]);

  async function confirmAdd() {
    if (!urlInput) {
      setSubmitError("Please enter a URL");
      return;
    }
    if (!extractedMeta?.title) {
      setSubmitError("Please wait for URL metadata to be extracted");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      const catId = categoryId ? Number(categoryId) : NaN;
      if (!Number.isFinite(catId)) throw new Error("Please select a category");
      const manualWeight = toManualWeight(selectedWeight);
      await createMyResourceFromUrl(urlInput, {
        category_id: catId,
        is_public: isPublic,
        manual_weight: manualWeight,
      });
      navigate("/my-resources");
    } catch (e: any) {
      setSubmitError(getErrorMessage(e, "Failed to add resource"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-violet-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Add
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                New
                <br />
                <span className="text-violet-600">Resource.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                URL · File
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Mode tabs */}
        <div className="flex gap-1 mb-8 border-b border-stone-200">
          <button
            type="button"
            className="relative px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors text-stone-900"
          >
            From URL
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"></span>
          </button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left: form */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Platform + URL input */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-violet-600 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
                  Source
                </h2>
              </div>

              {/* Platform selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Platform
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SUPPORTED_PLATFORMS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedPlatform(p.key)}
                      className={`py-2 px-3 rounded-sm border text-[11px] font-semibold uppercase tracking-wider transition-all ${
                        selectedPlatform === p.key
                          ? "border-violet-600 bg-violet-50 text-violet-700"
                          : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Resource URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={selectedPlatformPlaceholder}
                    className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
                  />
                  {extracting && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse"></div>
                      <span className="text-xs text-stone-400">Parsing…</span>
                    </div>
                  )}
                </div>
                {extractError && (
                  <p className="mt-2 text-xs text-red-500">{extractError}</p>
                )}
              </div>

              {/* Search resource to card */}
              <div className="bg-white rounded-md border border-stone-100 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-violet-500 rounded-full"></div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-stone-700">
                    Search resource to card
                  </h2>
                </div>

                {/* Search input + button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Keyword (e.g. react hooks)"
                    className="flex-1 h-9 px-3 border border-stone-200 rounded-sm bg-white text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="h-9 px-4 bg-violet-600 text-white text-xs font-semibold rounded-sm hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {searching ? "…" : "Search"}
                  </button>
                </div>

                {/* Platform tabs */}
                <div className="flex gap-1">
                  {(["github", "youtube"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSearchPlatform(p)}
                      className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                        searchPlatform === p
                          ? "bg-violet-600 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {p === "github" ? "GitHub" : "YouTube"}
                    </button>
                  ))}
                </div>

                {/* Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSearchResultClick(r.url)}
                        className="w-full text-left px-3 py-2 rounded-sm bg-stone-50 hover:bg-violet-50 border border-stone-100 hover:border-violet-200 transition-colors flex items-start gap-3"
                      >
                        {r.thumbnail && (
                          <img
                            src={r.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-sm object-cover shrink-0 bg-stone-200"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-stone-800 truncate">
                            {r.title}
                          </div>
                          {r.description && (
                            <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                              {r.description}
                            </div>
                          )}
                          <div className="text-[10px] text-violet-500 mt-0.5 truncate">
                            {r.url}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery && !searching && searchResults.length === 0 && (
                  <p className="text-xs text-stone-400">No results found.</p>
                )}
              </div>
            </div>

            {/* Metadata preview */}
            {extractedMeta && (
              <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
                    Metadata
                  </h2>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Thumbnail
                  </label>
                  <div className="relative aspect-video w-full rounded-none overflow-hidden bg-stone-100">
                    {extractedMeta.thumbnail_url ? (
                      <img
                        src={extractedMeta.thumbnail_url}
                        alt={extractedMeta.title || "thumbnail"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-stone-300"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Title
                  </label>
                  <p className="text-sm font-semibold text-stone-900">
                    {extractedMeta.title || "—"}
                  </p>
                </div>

                {/* Author + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                      Author
                    </label>
                    <p className="text-sm text-stone-700">
                      {extractedMeta.author || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                      Date
                    </label>
                    <p className="text-sm text-stone-700">
                      {formatExtractDate(extractedMeta.publish_date) || "—"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {extractedMeta.description && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                      Description
                    </label>
                    <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
                      {extractedMeta.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-stone-300 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
                  Options
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="flex-1 h-10 px-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 cursor-pointer"
                    >
                      <option value="">Select category</option>
                      {dbCategories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="h-10 w-10 border border-stone-200 rounded-sm bg-white text-stone-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center justify-center"
                      title="Create custom category"
                    >
                      <span className="text-lg font-medium leading-none">+</span>
                    </button>
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Visibility
                  </label>
                  <div className="flex h-10 items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isPublic === true}
                        onChange={() => setIsPublic(true)}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-stone-600">Public</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isPublic === false}
                        onChange={() => setIsPublic(false)}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-stone-600">Private</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Weight
                </label>
                <div className="flex gap-2 flex-wrap">
                  {WEIGHT_OPTIONS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setSelectedWeight(w.value)}
                      className={`h-8 px-3 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all ${
                        selectedWeight === w.value
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                className="rounded-full bg-violet-600 text-white hover:bg-violet-700 font-semibold text-sm px-8 py-2.5 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={
                  !urlInput || extracting || !extractedMeta?.title || submitting
                }
                onClick={confirmAdd}
              >
                {submitting ? "Saving…" : "Add resource →"}
              </Button>
            </div>
            {submitError && (
              <p className="text-sm text-red-500 text-right">{submitError}</p>
            )}
          </div>

          {/* Right: live card preview */}
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Live preview
                </span>
              </div>
              <div
                className="flex items-center justify-center bg-white border border-stone-200 rounded-lg p-8"
                style={{ minHeight: "560px" }}
              >
                <div className="w-full max-w-56">
                  <ResourceCard
                    resource={previewResource}
                    onOpen={() => {}}
                    onAdd={() => {}}
                    saving={false}
                    saved={false}
                    weight={selectedWeight}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-stone-900 text-white px-6 py-3 shadow-2xl flex items-center gap-3">
          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-sm font-semibold">{successToastText}</span>
          <button
            className="text-stone-400 hover:text-white ml-1"
            onClick={() => setShowSuccessToast(false)}
            aria-label="Dismiss notification"
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Category Create Modal */}
      <CategoryCreateModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
}
