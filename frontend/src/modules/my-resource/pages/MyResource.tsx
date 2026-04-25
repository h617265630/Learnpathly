import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ResourceCard,
  type UiResource as RcResource,
} from "@/components/ResourceCard";
import {
  deleteMyResource,
  listMyResources,
  updateUserResourceProfile,
  type DbResource,
} from "@/services/resource";
import { listCategories, type Category } from "@/services/category";
import { formatPlatform } from "@/lib/platform";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

type UiResource = {
  id: number;
  title: string;
  summary: string;
  category: string;
  categoryColor: string;
  platform: string;
  thumbnail: string;
  type: "video" | "document" | "article";
  addedDate?: string;
  is_system_public?: boolean;
  manual_weight?: number | null;
  user_seq?: number | null;
  custom_notes?: string | null;
  personal_rating?: number | null;
  is_favorite?: boolean | null;
};

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

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function mapDbToUi(r: DbResource): UiResource {
  const platform = String((r as any).platform || "").trim() || "—";
  const rawType = String((r as any).resource_type || "")
    .trim()
    .toLowerCase();
  const type: UiResource["type"] =
    rawType === "document" || rawType === "article" ? rawType : "video";
  const category = String((r as any).category_name || "").trim() || "Other";
  return {
    id: r.id,
    title: r.title,
    summary: String((r as any).summary || "").trim(),
    category,
    categoryColor: getCategoryColor(category),
    platform,
    thumbnail: String(r.thumbnail || "").trim() || FALLBACK_THUMB,
    type,
    addedDate: formatDate(r.created_at),
    is_system_public: Boolean((r as any).is_system_public),
    manual_weight: (r as any).manual_weight ?? null,
    user_seq: (r as any).user_seq ?? null,
    custom_notes: (r as any).custom_notes ?? null,
    personal_rating: (r as any).personal_rating ?? null,
    is_favorite: (r as any).is_favorite ?? null,
  };
}

function getWeightCardClass(resource: UiResource) {
  const w = Number(resource.manual_weight);
  // Use same mapping as fromManualWeight for consistency
  const map: Record<number, string> = {
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
  return map[w] || "border border-stone-200 bg-stone-50";
}

function toRcResource(r: UiResource): RcResource {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    categoryLabel: r.category,
    categoryColor: r.categoryColor,
    platform: r.platform,
    platformLabel: formatPlatform(r.platform),
    typeLabel: r.type,
    thumbnail: r.thumbnail,
    resource_type: r.type,
  };
}

// Convert numeric manual_weight to string weight for ResourceCard
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

export default function MyResource() {
  const navigate = useNavigate();
  const location = useLocation();

  const [resources, setResources] = useState<UiResource[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [publicUpdatingId, setPublicUpdatingId] = useState<number | null>(null);
  const [favoritingId, setFavoritingId] = useState<number | null>(null);
  const [clickedDeck, setClickedDeck] = useState<number | null>(null);
  const [locationKey, setLocationKey] = useState(location.key);

  const [activeResourceId, setActiveResourceId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UiResource | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [userCategories, setUserCategories] = useState<Category[]>([]);

  const activeResource = useMemo(() => {
    if (activeResourceId === null) return null;
    return resources.find((r) => r.id === activeResourceId) || null;
  }, [activeResourceId, resources]);

  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredResources = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    return resources.filter((r) => {
      if (
        ["xiaohongshu", "xhs"].includes(
          String(r.platform || "")
            .trim()
            .toLowerCase()
        )
      )
        return false;
      if (selectedCategory !== "All" && r.category !== selectedCategory)
        return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.platform.toLowerCase().includes(q)
      );
    });
  }, [resources, searchKeyword, selectedCategory]);

  type Deck = { key: string; name: string; cards: UiResource[] };

  const decks = useMemo<Deck[]>(() => {
    const map = new Map<string, UiResource[]>();
    for (const r of filteredResources) {
      const key = String(r.category || "").trim() || "Other";
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, cards]) => ({ key: name, name, cards }));
  }, [filteredResources]);

  // All categories from resources (not filtered) for category tabs
  const allDecks = useMemo<Deck[]>(() => {
    const map = new Map<string, UiResource[]>();
    for (const r of resources) {
      const key = String(r.category || "").trim() || "Other";
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
    // Add user-created categories that have no resources yet (empty decks)
    for (const cat of userCategories) {
      if (!cat.is_system && !map.has(cat.name)) {
        map.set(cat.name, []);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, cards]) => ({ key: name, name, cards }));
  }, [resources, userCategories]);

  const totalCards = useMemo(
    () => decks.reduce((sum, d) => sum + d.cards.length, 0),
    [decks]
  );

const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        listMyResources(),
        listCategories(),
      ]);
      setResources((data || []).map(mapDbToUi));
      setUserCategories(cats || []);
    } catch {
      setResources([]);
      setUserCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when location.key changes (e.g., after navigating back from edit page)
  useEffect(() => {
    if (location.key !== locationKey) {
      setLocationKey(location.key);
      load();
    }
  }, [location.key, locationKey, load]);

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") load();
    });
    return () => {
      window.removeEventListener("focus", load);
    };
  }, [load]);

  useEffect(() => {
    setClickedDeck(null);
  }, [location.pathname]);

  function isDeckExpanded(deckIndex: number) {
    return clickedDeck === null || clickedDeck === deckIndex;
  }

  function toggleDeck(deckIndex: number) {
    setClickedDeck(clickedDeck === deckIndex ? null : deckIndex);
  }

  function openCard(resource: UiResource) {
    setActiveResourceId(resource.id);
  }

  function closeActiveResource() {
    setActiveResourceId(null);
  }

  function seeDetail(resource: UiResource) {
    closeActiveResource();
    viewResource(resource);
  }

  function editFromModal(resource: UiResource) {
    closeActiveResource();
    navigate(`/my-resources/${resource.id}/edit`);
  }

  function deleteFromModal(resource: UiResource) {
    closeActiveResource();
    setDeleteTarget(resource);
    setShowDeleteConfirm(true);
  }

  function viewResource(resource: UiResource) {
    const name =
      resource.type === "video"
        ? "my-resource-video"
        : resource.type === "document"
        ? "my-resource-document"
        : "my-resource-article";
    navigate(
      `/${name.replace("my-", "my-resources/").replace("resource-", "")}`
        .replace("my-resources/video", "my-resources/video")
        .replace("my-resources/document", "my-resources/document")
        .replace("my-resources/article", "my-resources/article")
    );
    navigate(`/my-resources/${resource.type}/${resource.id}`);
  }

  function closeDeleteConfirm() {
    if (deletingId !== null) return;
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleteTarget || deletingId !== null) return;
    setDeleteError("");
    setDeletingId(deleteTarget.id);
    try {
      await deleteMyResource(deleteTarget.id);
      setResources((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(
        String(e?.response?.data?.detail || e?.message || "Failed to delete")
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function togglePublic(resource: UiResource) {
    setPublicUpdatingId(resource.id);
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== resource.id) return r;
        return { ...r, is_system_public: !Boolean(r.is_system_public) };
      })
    );
    setPublicUpdatingId(null);
  }

  async function toggleFavorite(resource: UiResource) {
    setFavoritingId(resource.id);
    try {
      const newVal = !(resource.is_favorite ?? false);
      await updateUserResourceProfile(resource.id, { is_favorite: newVal });
      setResources((prev) =>
        prev.map((r) => {
          if (r.id !== resource.id) return r;
          return { ...r, is_favorite: newVal };
        })
      );
    } catch {
      // silently fail
    } finally {
      setFavoritingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-indigo-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Personal
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.92]">
                My
                <br />
                <span className="text-indigo-600">Resources.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <span className="text-xs text-stone-400">
                <span className="font-semibold text-stone-700">
                  {totalCards}
                </span>{" "}
                resources ·
                <span className="font-semibold text-stone-700">
                  {decks.length}
                </span>{" "}
                decks
              </span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-6 space-y-3">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search your resources..."
                  aria-label="Search your resources"
                  className="h-10 w-full rounded-none border border-stone-200 bg-white pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="rounded-none bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-xs uppercase tracking-wider px-5"
                  onClick={() => navigate("/my-resources/add")}
                >
                  + Add
                </Button>
              </div>
            </div>

            {/* Category tabs */}
            {allDecks.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`shrink-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-all ${
                    selectedCategory === "All"
                      ? "bg-indigo-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  All ({totalCards})
                </button>
                {allDecks.map((deck) => (
                  <button
                    key={deck.key}
                    type="button"
                    onClick={() => setSelectedCategory(deck.name)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-all ${
                      selectedCategory === deck.name
                        ? "bg-indigo-600 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {deck.name} ({deck.cards.length})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-sm text-stone-400">
                Loading your library…
              </span>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredResources.length === 0 && (
          <div className="py-20 text-center">
             <div className="flex justify-center mb-4">
              <img
                src="/favicon.png"
                alt="Learnpathly"
                className="h-12 w-12"
              />
            </div>
            <h3 className="text-base font-semibold text-stone-700 mb-1">
              No resources yet
            </h3>
            <p className="text-sm text-stone-400 mb-5">
              Start by adding your first resource to build your personal
              library.
            </p>
            <Button
              className="rounded-none bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-sm"
              onClick={() => navigate("/my-resources/add")}
            >
              + Add your first resource
            </Button>
          </div>
        )}

        {/* Decks */}
        {!loading &&
          filteredResources.length > 0 &&
          decks.map((deck, deckIndex) => (
            <div key={deck.key} className="mb-12">
              {/* Deck header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                  <h2 className="text-base font-bold text-stone-900 tracking-tight">
                    {deck.name}
                  </h2>
                  <span className="text-xs text-stone-400 font-medium">
                    {deck.cards.length} cards
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDeck(deckIndex)}
                  className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {isDeckExpanded(deckIndex) ? "Collapse" : "Expand"}
                </button>
              </div>

              {/* Expanded grid */}
              {isDeckExpanded(deckIndex) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {deck.cards.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={toRcResource(resource)}
                      onOpen={() => openCard(resource)}
                      onAdd={() => {}}
                      saving={false}
                      saved={false}
                      weight={fromManualWeight(resource.manual_weight)}
                    />
                  ))}
                </div>
              )}

              {/* Collapsed fan view */}
              {!isDeckExpanded(deckIndex) && (
                <div
                  className="relative h-52 overflow-visible cursor-pointer"
                  onClick={() => toggleDeck(deckIndex)}
                >
                  <div
                    className="inline-flex items-center h-full"
                    style={{ paddingLeft: "12px" }}
                  >
                    {deck.cards.slice(0, 5).map((resource, cardIndex) => (
                      <div
                        key={resource.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCard(resource);
                        }}
                        className={`shrink-0 w-44 rounded-sm overflow-hidden bg-white border border-stone-100 shadow-sm transition-all duration-300 cursor-pointer hover:shadow-xl flex flex-col ${getWeightCardClass(
                          resource
                        )}`}
                        style={{
                          marginLeft: cardIndex === 0 ? "0" : "-176px",
                          zIndex: cardIndex,
                          transform: `rotate(${(5 - 1 - cardIndex) * 0.3}deg)`,
                        }}
                      >
                        <div
                          className="relative bg-stone-100 overflow-hidden z-10"
                          style={{ width: "100%", aspectRatio: "16 / 9" }}
                        >
                          <img
                            src={resource.thumbnail || FALLBACK_THUMB}
                            alt={resource.title}
                            className="block w-full h-full object-contain bg-stone-50/50"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                          <div className="absolute top-1.5 left-1.5">
                            <Badge
                              variant="secondary"
                              className="text-[8px] uppercase tracking-wider px-1.5 py-0.5"
                            >
                              {resource.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 p-2.5 flex flex-col">
                          <span
                            className="text-[9px] font-semibold uppercase tracking-wider mb-0.5"
                            style={{ color: resource.categoryColor }}
                          >
                            {resource.category}
                          </span>
                          <h3
                            className="text-[11px] font-semibold text-stone-800 leading-snug line-clamp-2"
                            title={resource.title}
                          >
                            {resource.title}
                          </h3>
                          <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-2 flex-1">
                            {resource.summary}
                          </p>
                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-stone-50">
                            <span className="text-[9px] text-stone-400">
                              {formatPlatform(resource.platform)}
                            </span>
                            <span className="text-[9px] text-stone-400">
                              #{resource.user_seq ?? resource.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </main>

      {/* Detail modal */}
      {activeResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={closeActiveResource}
        >
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"></div>
          <div
            className="relative w-full max-w-xs sm:max-w-sm md:max-w-md rounded-md overflow-hidden bg-white shadow-2xl border border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative bg-stone-100 overflow-hidden z-10"
              style={{ width: "100%", aspectRatio: "16 / 9" }}
            >
              <img
                src={activeResource.thumbnail || FALLBACK_THUMB}
                alt={activeResource.title}
                className="block w-full h-full object-contain bg-stone-50"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              <button
                className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition"
                onClick={closeActiveResource}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 border-b border-stone-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                  style={{
                    backgroundColor: activeResource.categoryColor + "18",
                    color: activeResource.categoryColor,
                  }}
                >
                  {activeResource.category}
                </span>
                <span className="text-[10px] text-stone-400">
                  #{String(activeResource.id).padStart(3, "0")}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                {activeResource.title}
              </h2>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-stone-500 mb-3 sm:mb-4 leading-relaxed line-clamp-3 sm:line-clamp-none">
                {activeResource.summary}
              </p>
              <div className="flex items-center gap-3 sm:gap-4 text-xs text-stone-400">
                <span>{formatPlatform(activeResource.platform)}</span>
                <span className="text-stone-200 hidden sm:inline">·</span>
                <span className="font-semibold text-stone-600 uppercase tracking-wider text-[10px]">
                  {activeResource.type}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-stone-100 flex flex-col gap-3">
              <Button
                onClick={() => seeDetail(activeResource)}
                className="w-full rounded-full bg-stone-900 text-white hover:bg-stone-800 font-semibold text-xs sm:text-sm transition-all"
              >
                View details
              </Button>
              <div className="flex items-center gap-2">
                {/* Favorite toggle */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(activeResource)}
                  disabled={favoritingId === activeResource.id}
                  className={`relative inline-flex h-8 w-20 items-center rounded-full border p-0.5 transition-colors ${
                    activeResource.is_favorite
                      ? "border-amber-300 bg-amber-50"
                      : "border-stone-200 bg-stone-50"
                  }`}
                  aria-label="Toggle favorite"
                >
                  <span
                    className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-0.25rem)] rounded-full shadow-sm transition-transform duration-200 ${
                      activeResource.is_favorite
                        ? "bg-amber-400"
                        : "bg-stone-200"
                    }`}
                    style={{
                      transform: activeResource.is_favorite
                        ? "translateX(calc(100% + 0.25rem))"
                        : "translateX(0)",
                    }}
                  />
                  <span className="relative z-10 flex w-full text-[11px] font-semibold">
                    <span
                      className={`flex w-1/2 justify-center ${
                        activeResource.is_favorite
                          ? "text-stone-400"
                          : "text-stone-600"
                      }`}
                    >
                      ☆
                    </span>
                    <span
                      className={`flex w-1/2 justify-center ${
                        activeResource.is_favorite
                          ? "text-white"
                          : "text-stone-400"
                      }`}
                    >
                      ★
                    </span>
                  </span>
                </button>

                {/* Personal rating */}
                {activeResource.personal_rating != null &&
                  activeResource.personal_rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < (activeResource.personal_rating ?? 0)
                              ? "text-amber-400"
                              : "text-stone-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}

                <div className="flex-1"></div>

                {/* Privacy toggle */}
                <button
                  type="button"
                  onClick={() => togglePublic(activeResource)}
                  disabled={publicUpdatingId === activeResource.id}
                  className="relative inline-flex h-8 w-28 items-center rounded-full border border-stone-200 bg-stone-50 p-0.5 transition-colors"
                  aria-label="Toggle privacy"
                >
                  <span
                    className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-0.25rem)] rounded-full shadow-sm transition-transform duration-200 ${
                      activeResource.is_system_public
                        ? "bg-red-400"
                        : "bg-indigo-400"
                    }`}
                    style={{
                      transform: activeResource.is_system_public
                        ? "translateX(calc(100% + 0.25rem))"
                        : "translateX(0)",
                    }}
                  />
                  <span className="relative z-10 flex w-full text-[11px] font-semibold">
                    <span
                      className={`flex w-1/2 justify-center ${
                        activeResource.is_system_public
                          ? "text-stone-400"
                          : "text-white"
                      }`}
                    >
                      Private
                    </span>
                    <span
                      className={`flex w-1/2 justify-center ${
                        activeResource.is_system_public
                          ? "text-white"
                          : "text-stone-400"
                      }`}
                    >
                      Public
                    </span>
                  </span>
                </button>

                <div className="flex-1"></div>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none h-8 text-xs"
                  onClick={() => editFromModal(activeResource)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none h-8 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                  disabled={deletingId === activeResource.id}
                  onClick={() => deleteFromModal(activeResource)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-xs sm:max-w-sm rounded-md bg-white shadow-2xl border border-stone-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                Delete resource?
              </h2>
              <button
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"
                onClick={closeDeleteConfirm}
                disabled={deletingId !== null}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              <p className="text-xs sm:text-sm text-stone-600">
                This will be removed from your My Resources. Are you sure you
                want to delete it?
              </p>
              <div className="rounded-md border border-stone-100 bg-stone-50/50 p-3">
                <div className="text-sm font-semibold text-stone-800 line-clamp-1">
                  {deleteTarget.title}
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  ID: {deleteTarget.id}
                </div>
              </div>
              {deleteError && (
                <p className="text-xs sm:text-sm text-red-500">{deleteError}</p>
              )}
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-100 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-none h-8 text-xs"
                onClick={closeDeleteConfirm}
                disabled={deletingId !== null}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-none h-8 text-xs bg-red-500 text-white hover:bg-red-600 border-0"
                onClick={confirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
