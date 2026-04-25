import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ResourceCard, type UiResource } from "@/components/ResourceCard";
import { ResourceDetailModal } from "@/components/ui/ResourceDetailModal";
import { CardHero } from "@/components/CardHero";
import {
  listResources,
  listMyResources,
  addPublicResourceToMyResourcesWithStatusAndWeight,
  type DbResource,
} from "@/services/resource";
import { listCategories, type Category } from "@/services/category";
import { formatPlatform } from "@/lib/platform";
import { useAuth } from "@/stores/auth";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

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

function normalizeResourceType(t: string): string {
  return String(t || "")
    .trim()
    .toLowerCase();
}

function displayResourceType(r: DbResource): string {
  const raw = normalizeResourceType(r.resource_type);
  if (raw === "video" || raw === "document" || raw === "article") return raw;
  return "article";
}

function mapDbToUi(r: DbResource): UiResource {
  const categoryLabel =
    String((r as any).category_name || "").trim() || "Other";
  return {
    id: r.id,
    title: r.title,
    summary: String(r.summary || "").trim(),
    categoryLabel,
    categoryColor: getCategoryColor(categoryLabel),
    platform: String((r as any).platform || "").trim(),
    platformLabel: formatPlatform((r as any).platform),
    typeLabel: displayResourceType(r),
    thumbnail: String(r.thumbnail || "").trim() || FALLBACK_THUMB,
    resource_type: r.resource_type,
  };
}

export default function ResourceLibrary() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const [resources, setResources] = useState<DbResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeType, setActiveType] = useState("all");

  const [addingToMy, setAddingToMy] = useState<Record<number, boolean>>({});
  const [addedToMy, setAddedToMy] = useState<Record<number, boolean>>({});

  const [activeResourceId, setActiveResourceId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const categoryOptions = useMemo(
    () => ["All", ...categories.map((c) => c.name)],
    [categories]
  );

  const typeFilters = [
    { label: "All", value: "all" },
    { label: "Video", value: "video" },
    { label: "Article", value: "article" },
    { label: "Document", value: "document" },
  ];

  const uiResources = useMemo(() => resources.map(mapDbToUi), [resources]);

  const filteredResources = useMemo(() => {
    return uiResources.filter((r) => {
      // Filter out xiaohongshu and reddit
      const platform = r.platform.toLowerCase();
      if (
        platform === "xiaohongshu" ||
        platform === "xhs" ||
        platform.includes("小红书")
      )
        return false;
      if (platform === "reddit") return false;

      // Category filter
      if (selectedCategory !== "All" && r.categoryLabel !== selectedCategory)
        return false;

      // Type filter
      if (activeType !== "all" && r.typeLabel !== activeType) return false;

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)
      );
    });
  }, [uiResources, selectedCategory, activeType, searchQuery]);

  const activeResource = useMemo(() => {
    if (activeResourceId === null) return null;
    return resources.find((r) => r.id === activeResourceId) || null;
  }, [activeResourceId, resources]);

  useEffect(() => {
    // Fetch resources and categories independently to avoid one failure blocking the other
    listResources()
      .then((res) => setResources(res || []))
      .catch(() => setResources([]));

    listCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => setCategories([]));

    setLoading(false);

    // Sync which resources are already added (only if logged in)
    if (isAuthed) {
      listMyResources()
        .then((mine) => {
          const next: Record<number, boolean> = {};
          for (const r of mine || []) {
            if (r?.id) next[r.id] = true;
          }
          setAddedToMy(next);
        })
        .catch(() => {});
    }
  }, [isAuthed]);

  function openCard(resource: UiResource) {
    setActiveResourceId(resource.id);
  }

  function closeActiveResource() {
    setActiveResourceId(null);
  }

  function seeDetail(resource: UiResource) {
    closeActiveResource();
    const t = resource.typeLabel;
    const name =
      t === "video"
        ? "resource-video"
        : t === "document"
        ? "resource-document"
        : "resource-article";
    navigate(`/resources/${t}/${resource.id}`);
  }

  async function addToMyResources(resource: UiResource) {
    if (!resource?.id) return;
    if (addingToMy[resource.id] || addedToMy[resource.id]) return;
    setAddingToMy((prev) => ({ ...prev, [resource.id]: true }));
    try {
      const result = await addPublicResourceToMyResourcesWithStatusAndWeight(
        resource.id,
        { manual_weight: 100 }
      );
      setAddedToMy((prev) => ({ ...prev, [resource.id]: true }));
      if (result?.already_exists) {
        showToastMessage(
          "Already Saved",
          "This resource is already in your My Resources."
        );
      } else {
        showToastMessage("Saved!", "Resource added to My Resources.");
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to save";
      showToastMessage("Failed", String(msg));
    } finally {
      setAddingToMy((prev) => ({ ...prev, [resource.id]: false }));
    }
  }

  function showToastMessage(title: string, message: string) {
    setToastMessage(`${title}: ${message}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Masthead header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="flex items-end justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="h-px w-6 sm:w-8 bg-amber-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Discover
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.92]">
                Resource
                <br />
                <span className="text-amber-600">Library.</span>
              </h1>
            </div>
            <p className="hidden lg:block text-sm leading-relaxed text-stone-500 max-w-xs">
              Browse and discover public resources. Add them to your personal
              library with one click.
            </p>
          </div>

          {/* Filter bar */}
          <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources, topics..."
                aria-label="Search resources"
                className="h-11 sm:h-11 w-full rounded-none border border-stone-200 bg-white pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-colors"
              />
            </div>

            {/* Category and clear filters row */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Category filter */}
              <div className="relative flex-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none h-11 rounded-none border border-stone-200 bg-white pl-3 sm:pl-4 pr-8 sm:pr-10 text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-colors cursor-pointer w-full"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Clear filters - visible when filters active */}
              {(searchQuery || selectedCategory !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="h-11 px-3 sm:px-4 rounded-none border border-stone-200 bg-white text-xs sm:text-sm font-semibold text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Type pills */}
          <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2 flex-wrap">
            {typeFilters.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveType(t.value)}
                className={`h-9 sm:h-9 px-2.5 sm:px-3 rounded-sm border text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeType === t.value
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8">
        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-sm text-stone-400">Loading resources…</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredResources.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-base font-semibold text-stone-700 mb-1">
              No resources found
            </h3>
            <p className="text-sm text-stone-400">
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your filters."
                : "Nothing public yet."}
            </p>
          </div>
        )}

        {/* Resource grid */}
        {!loading && filteredResources.length > 0 && (
          <div>
            {/* Results count */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <p className="text-xs sm:text-sm text-stone-400">
                <span className="font-semibold text-stone-600">
                  {filteredResources.length}
                </span>{" "}
                resources
              </p>
            </div>

            {/* Editorial grid: alternating hero and standard cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredResources.map((resource, idx) => {
                const isHero = idx % 7 === 0 && idx > 0;
                const saving = !!addingToMy[resource.id];
                const saved = !!addedToMy[resource.id];

                if (isHero) {
                  return (
                    <div
                      key={resource.id}
                      className="col-span-2 sm:col-span-3 md:col-span-3 lg:col-span-4 xl:col-span-5"
                    >
                      <CardHero
                        resource={resource}
                        onOpen={() => openCard(resource)}
                        onAdd={() => addToMyResources(resource)}
                        saving={saving}
                        saved={saved}
                      />
                    </div>
                  );
                }

                return (
                  <div key={resource.id} className="col-span-1">
                    <ResourceCard
                      resource={resource}
                      onOpen={() => openCard(resource)}
                      onAdd={() => addToMyResources(resource)}
                      saving={saving}
                      saved={saved}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {activeResource && (
        <ResourceDetailModal
          resource={mapDbToUi(activeResource)}
          onClose={closeActiveResource}
          onSave={() => addToMyResources(mapDbToUi(activeResource))}
          saving={addingToMy[activeResource.id] ?? false}
          saved={addedToMy[activeResource.id] ?? false}
        />
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 rounded-sm bg-stone-900 text-white px-6 py-3 shadow-2xl flex items-center gap-3 animate-fade-in">
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
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            className="text-stone-400 hover:text-white transition-colors ml-1"
            onClick={() => setShowToast(false)}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
