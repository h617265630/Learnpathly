import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import "@/components/card-ui.css";
import {
  listMyResources,
  type DbResource,
} from "@/services/resource";
import {
  createLearningPathWithCategory,
  addResourceToMyLearningPath,
} from "@/services/learningPath";
import { listCategories, type Category } from "@/services/category";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/cn";
import { ManualWeight } from "../components/ManualWeight";
import { CoverPicker } from "../components/CoverPicker";
import { ResourceList } from "../components/ResourceList";
import { ResourceSelected } from "../components/ResourceSelected";
import {
  toUiResource,
  toAbsoluteImageUrl,
  USER_MENU_ITEMS,
  toManualWeight,
  type UiResource,
  type ResourceType,
} from "../utils/pathUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PathMeta = {
  title: string;
  description: string;
  type: string;
  isPublic: boolean;
  categoryId: number | null;
  coverImageUrl: string;
};

type TemplateId = "github_trends" | "social_news";

// ─── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES: Record<
  TemplateId,
  { label: string; description: string; meta: Partial<PathMeta> }
> = {
  github_trends: {
    label: "GitHub Trends",
    description: "Track trending repos and tech updates in a structured path",
    meta: {
      title: "GitHub Trends Weekly",
      description:
        "Track GitHub Trending weekly: shortlist repos, read READMEs, capture key ideas, and turn them into an actionable learning path.",
      type: "structured path",
      isPublic: true,
    },
  },
  social_news: {
    label: "Social News",
    description: "Collect articles and organize news by topic into a pool",
    meta: {
      title: "Social News Digest",
      description:
        "Collect tech news, articles, and podcasts you care about: organize by topic, review regularly, and refine over time.",
      type: "partical pool",
      isPublic: true,
    },
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CreatePath() {
  const navigate = useNavigate();
  const { user, isAuthed, logout } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Path metadata
  const [pathMeta, setPathMeta] = useState<PathMeta>({
    title: "",
    description: "",
    type: "linear path",
    isPublic: true,
    categoryId: null,
    coverImageUrl: "",
  });

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | "">("");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  // Resources
  const [allResources, setAllResources] = useState<UiResource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected resources
  const [selected, setSelected] = useState<UiResource[]>([]);

  // Drag state
  const [selectedDragState, setSelectedDragState] = useState({
    draggingId: -1,
    fromIndex: -1,
    overIndex: -1,
  });

  // Cover
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string>("");
  const [defaultCoverUrls, setDefaultCoverUrls] = useState<string[]>([]);

  // Weight
  const [selectedWeight, setSelectedWeight] = useState("default");

  // Submit
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Load categories
  useEffect(() => {
    async function load() {
      setCategoriesLoading(true);
      setCategoriesError("");
      try {
        const res = await listCategories();
        const cats = res ?? [];
        setCategories(cats);
        if (pathMeta.categoryId == null) {
          const other = cats.find(
            (c) => String((c as any).code || "").toLowerCase() === "other"
          );
          if (other) {
            setPathMeta((prev) => ({ ...prev, categoryId: other.id }));
          } else if (cats.length > 0) {
            setPathMeta((prev) => ({ ...prev, categoryId: cats[0].id }));
          }
        }
      } catch (e: any) {
        setCategoriesError(e?.message || "Failed to load categories");
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    }
    void load();
  }, []);

  // Load resources
  useEffect(() => {
    async function load() {
      try {
        const rows = await listMyResources();
        const resources = Array.isArray(rows) ? rows.map(toUiResource) : [];
        setAllResources(resources);
        const thumbs = resources
          .map((r) => String(r.thumbnail || "").trim())
          .filter(Boolean);
        const unique: string[] = [];
        for (const t of thumbs) {
          if (!unique.includes(t)) {
            unique.push(t);
            if (unique.length >= 20) break;
          }
        }
        setDefaultCoverUrls(unique);
        if (!pathMeta.coverImageUrl && unique[0]) {
          selectCover(unique[0]);
        }
      } catch {
        setAllResources([]);
        setDefaultCoverUrls([]);
      }
    }
    void load();
  }, []);

  // Template
  function applyTemplate(id: TemplateId) {
    setSelectedTemplate(id);
    const t = TEMPLATES[id];
    setPathMeta((prev) => ({
      ...prev,
      ...t.meta,
    }));
  }

  // Cover
  function selectCover(url: string) {
    setPathMeta((prev) => ({
      ...prev,
      coverImageUrl: toAbsoluteImageUrl(url),
    }));
  }

  function onCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "").trim();
      if (url) {
        setUploadedCoverUrl(url);
        selectCover(url);
      }
    };
    reader.readAsDataURL(file);
  }

  // Selected resources
  function addResource(resource: UiResource) {
    if (selected.some((r) => r.id === resource.id)) return;
    setSelected((prev) => [...prev, resource]);
    const firstThumb = String(selected[0]?.thumbnail || "").trim();
    if (
      (!pathMeta.coverImageUrl || isDefaultCover(pathMeta.coverImageUrl)) &&
      firstThumb
    ) {
      selectCover(firstThumb);
    }
  }

  function removeResource(id: number) {
    setSelected((prev) => prev.filter((r) => r.id !== id));
    const firstThumb = String(selected[0]?.thumbnail || "").trim();
    if (
      (!pathMeta.coverImageUrl || isDefaultCover(pathMeta.coverImageUrl)) &&
      firstThumb
    ) {
      selectCover(firstThumb);
    }
  }

  function clearSelected() {
    setSelected([]);
  }

  function isDefaultCover(url: string) {
    return String(url || "").startsWith("data:image/svg+xml");
  }

  // Drag and drop
  function handleDragStart(e: React.DragEvent, resource: UiResource) {
    e.dataTransfer?.setData("text/plain", String(resource.id));
    e.dataTransfer!.effectAllowed = "copy";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const reorderId =
      e.dataTransfer?.getData("application/x-selected-resource-id") || "";
    const reorderFromStr =
      e.dataTransfer?.getData("application/x-selected-resource-from") || "";
    if (reorderId && reorderFromStr) {
      const fromIndex = Number(reorderFromStr);
      if (Number.isFinite(fromIndex))
        moveSelected(fromIndex, selected.length - 1);
      return;
    }
    const resourceId = e.dataTransfer?.getData("text/plain") || "";
    const n = Number(resourceId);
    const hit = Number.isFinite(n)
      ? allResources.find((r) => r.id === n)
      : undefined;
    if (hit) addResource(hit);
  }

  function moveSelected(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...selected];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    setSelected(next);
  }

  function onSelectedDragStart(e: React.DragEvent, id: number, idx: number) {
    setSelectedDragState({ draggingId: id, fromIndex: idx, overIndex: idx });
    e.dataTransfer?.setData("application/x-selected-resource-id", String(id));
    e.dataTransfer?.setData(
      "application/x-selected-resource-from",
      String(idx)
    );
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  }

  function onSelectedDragOver(idx: number) {
    setSelectedDragState((prev) => ({ ...prev, overIndex: idx }));
  }

  function onSelectedDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const fromStr =
      e.dataTransfer?.getData("application/x-selected-resource-from") || "";
    if (!fromStr) return;
    const fromIndex = Number(fromStr);
    if (Number.isFinite(fromIndex)) moveSelected(fromIndex, dropIndex);
  }

  function onSelectedDragEnd() {
    setSelectedDragState({ draggingId: -1, fromIndex: -1, overIndex: -1 });
  }

  // Submit
  async function handleSubmit() {
    if (
      !pathMeta.title.trim() ||
      selected.length === 0 ||
      pathMeta.categoryId == null
    )
      return;
    setCreateError("");
    setCreating(true);
    try {
      const coverUrl = String(pathMeta.coverImageUrl || "").trim() || null;
      const created: any = await createLearningPathWithCategory({
        title: pathMeta.title,
        type: pathMeta.type,
        description: pathMeta.description,
        is_public: pathMeta.isPublic,
        cover_image_url: coverUrl,
        category_id: pathMeta.categoryId,
      });
      const lpId = Number(created?.id);
      if (!Number.isFinite(lpId) || lpId <= 0) {
        throw new Error("Create failed: invalid learning path id");
      }
      for (let i = 0; i < selected.length; i++) {
        try {
          await addResourceToMyLearningPath(lpId, {
            resource_id: selected[i].id,
            order_index: i + 1,
            is_optional: false,
            manual_weight: toManualWeight(selectedWeight),
          });
        } catch (e: any) {
          const msg =
            e?.response?.data?.detail || e?.message || "Unknown error";
          throw new Error(
            `Failed to add resource "${selected[i].title}": ${msg}`
          );
        }
      }
      navigate(`/learningpath/${lpId}?from=my-paths`);
    } catch (e: any) {
      setCreateError(
        String(e?.message || e?.response?.data?.detail || "Create failed")
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveDraft() {
    if (!pathMeta.title.trim() || pathMeta.categoryId == null) return;
    setCreateError("");
    setCreating(true);
    try {
      const coverUrl = String(pathMeta.coverImageUrl || "").trim() || null;
      const created: any = await createLearningPathWithCategory({
        title: pathMeta.title,
        type: pathMeta.type,
        description: pathMeta.description,
        is_public: false,
        cover_image_url: coverUrl,
        category_id: pathMeta.categoryId,
      });
      const lpId = Number(created?.id);
      if (!Number.isFinite(lpId) || lpId <= 0) {
        throw new Error("Save draft failed: invalid learning path id");
      }
      navigate(`/learningpath/${lpId}?from=my-paths`);
    } catch (e: any) {
      setCreateError(
        String(e?.response?.data?.detail || e?.message || "Save draft failed")
      );
    } finally {
      setCreating(false);
    }
  }

  const canSubmit =
    pathMeta.title.trim() &&
    selected.length > 0 &&
    pathMeta.categoryId != null &&
    !creating;
  const canSaveDraft =
    pathMeta.title.trim() && pathMeta.categoryId != null && !creating;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-sky-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Create
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Build a<br />
                <span className="text-sky-600">Learning Path.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Top meta panel */}
        <section className="bg-white rounded-md border border-stone-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-sky-600 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
              Path Details
            </h2>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left: inputs */}
            <div className="col-span-12 lg:col-span-7 space-y-5">
              {/* Templates */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`rounded-sm border p-3.5 text-left transition-all ${
                        selectedTemplate === id
                          ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                      }`}
                      onClick={() => applyTemplate(id)}
                    >
                      <p className="text-xs font-bold text-stone-800">
                        {TEMPLATES[id].label}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">
                        {TEMPLATES[id].description}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-stone-400">
                  Click a template to auto-fill the fields below.
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={pathMeta.title}
                  onChange={(e) =>
                    setPathMeta((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. AI Engineer Starter"
                  maxLength={200}
                  className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Description
                </label>
                <textarea
                  value={pathMeta.description}
                  onChange={(e) =>
                    setPathMeta((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe the goal and content of this learning path"
                  className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none transition-colors"
                />
              </div>

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={pathMeta.type}
                      onChange={(e) =>
                        setPathMeta((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 pr-8 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 cursor-pointer appearance-none"
                    >
                      <option value="linear path">Linear path</option>
                      <option value="partical pool">Partical pool</option>
                      <option value="structured path">Structured path</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={pathMeta.categoryId ?? ""}
                      onChange={(e) =>
                        setPathMeta((prev) => ({
                          ...prev,
                          categoryId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      disabled={categoriesLoading || categories.length === 0}
                      className="w-full h-10 px-3 pr-8 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                  {categoriesError && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {categoriesError}
                    </p>
                  )}
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between rounded-sm border border-stone-100 bg-stone-50/50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-stone-700">
                    Visibility
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Public: appears in LearningPool · Private: only visible to
                    you
                  </p>
                </div>
                <button
                  type="button"
                  className={`relative h-7 w-14 rounded-full transition-colors focus:outline-none ${
                    pathMeta.isPublic ? "bg-sky-500" : "bg-stone-300"
                  }`}
                  onClick={() =>
                    setPathMeta((prev) => ({
                      ...prev,
                      isPublic: !prev.isPublic,
                    }))
                  }
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      pathMeta.isPublic ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Right: cover picker */}
            <div className="col-span-12 lg:col-span-5">
              <CoverPicker
                coverImageUrl={pathMeta.coverImageUrl}
                defaultCoverUrls={defaultCoverUrls}
                uploadedCoverUrl={uploadedCoverUrl}
                accentColor="sky"
                onSelectCover={selectCover}
                onCoverFileChange={onCoverFileChange}
              />

              {/* Weight below cover */}
              <div className="mt-4">
                <ManualWeight
                  value={selectedWeight}
                  onChange={setSelectedWeight}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Resources + Selected panels */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Left: available resources */}
          <ResourceList
            allResources={allResources}
            selected={selected}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddResource={addResource}
            onDragStart={handleDragStart}
          />

          {/* Right: selected resources */}
          <ResourceSelected
            selected={selected}
            weight={selectedWeight}
            onClearAll={clearSelected}
            onRemove={removeResource}
            onDrop={onDrop}
            onDragStart={onSelectedDragStart}
            onDragEnd={onSelectedDragEnd}
            onDragOver={onSelectedDragOver}
            onDropItem={onSelectedDrop}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 font-semibold text-sm px-8 py-3 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-stone-200"
            disabled={!canSaveDraft}
            onClick={handleSaveDraft}
          >
            {creating ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="button"
            className="rounded-full bg-sky-600 text-white hover:bg-sky-700 font-semibold text-sm px-10 py-3 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-sky-600/20"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {creating ? "Creating…" : pathMeta.isPublic ? "Publish Learning Path →" : "Create Learning Path →"}
          </button>
        </div>
        {createError && (
          <p className="text-sm text-red-500 text-right mt-2">{createError}</p>
        )}
      </main>
    </div>
  );
}
