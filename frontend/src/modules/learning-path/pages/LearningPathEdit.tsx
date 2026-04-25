import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
} from "lucide-react";
import "@/components/card-ui.css";
import {
  listMyResources,
  type DbResource,
} from "@/services/resource";
import {
  getMyLearningPathDetail,
  updateMyLearningPath,
  addResourceToMyLearningPath,
  removeResourceFromMyLearningPath,
} from "@/services/learningPath";
import { listCategories, type Category } from "@/services/category";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/cn";
import {
  toUiResource,
  toAbsoluteImageUrl,
  USER_MENU_ITEMS,
  toManualWeight,
  type UiResource,
} from "../utils/pathUtils";
import { ManualWeight } from "../components/ManualWeight";
import { CoverPicker } from "../components/CoverPicker";
import { ResourceList } from "../components/ResourceList";
import { ResourceSelected } from "../components/ResourceSelected";

// ─── Types ────────────────────────────────────────────────────────────────────

type PathMeta = {
  title: string;
  description: string;
  type: string;
  isPublic: boolean;
  categoryId: number | null;
  coverImageUrl: string;
  manualWeight: string;
  isForked: boolean;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LearningPathEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
    manualWeight: "default",
    isForked: false,
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  // Resources
  const [allResources, setAllResources] = useState<UiResource[]>([]);

  // Selected resources (already in the path)
  const [selected, setSelected] = useState<UiResource[]>([]);
  // Original path items from server (to track what to delete on save)
  const [originalItemIds, setOriginalItemIds] = useState<Set<number>>(new Set());

  // Cover
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string>("");
  const [defaultCoverUrls, setDefaultCoverUrls] = useState<string[]>([]);

  // Submit
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Load resources and path data
  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        // Load path details
        const path = await getMyLearningPathDetail(Number(id));
        setPathMeta({
          title: String(path.title || ""),
          description: String(path.description || ""),
          type: String(path.type || "linear path"),
          isPublic: Boolean(path.is_public),
          categoryId: (path as any).category_id ?? null,
          coverImageUrl: String((path as any).cover_image_url || "").trim(),
          manualWeight: String((path as any).manual_weight || "default").trim(),
          isForked: Boolean((path as any).parent_id != null),
        });

        // Load existing path resources from path_items
        const items = Array.isArray(path.path_items) ? path.path_items : [];
        const selectedRes: UiResource[] = [];
        for (const item of items) {
          const r = item.resource_data;
          if (r) {
            selectedRes.push(toUiResource(r as unknown as DbResource));
          }
        }
        // Sort by order_index
        selectedRes.sort((a, b) => {
          const ia = items.findIndex(
            (it: any) => Number(it.resource_id) === a.id
          );
          const ib = items.findIndex(
            (it: any) => Number(it.resource_id) === b.id
          );
          return ia - ib;
        });
        setSelected(selectedRes);
        setOriginalItemIds(new Set(items.map((it: any) => Number(it.resource_id))));

        // Load all user resources
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
      } catch {
        setAllResources([]);
        setSelected([]);
        setDefaultCoverUrls([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

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
  }

  function removeResource(id: number) {
    setSelected((prev) => prev.filter((r) => r.id !== id));
  }

  function clearSelected() {
    setSelected([]);
  }

  // Drag and drop
  function handleDragStart(e: React.DragEvent, resource: UiResource) {
    e.dataTransfer?.setData("text/plain", String(resource.id));
    e.dataTransfer!.effectAllowed = "copy";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
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
    e.dataTransfer?.setData("application/x-selected-resource-id", String(id));
    e.dataTransfer?.setData(
      "application/x-selected-resource-from",
      String(idx)
    );
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  }

  function onSelectedDragOver(_idx: number) {}

  function onSelectedDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const fromStr =
      e.dataTransfer?.getData("application/x-selected-resource-from") || "";
    if (!fromStr) return;
    const fromIndex = Number(fromStr);
    if (Number.isFinite(fromIndex)) moveSelected(fromIndex, dropIndex);
  }

  function onSelectedDragEnd() {}

  // Submit
  async function handleSubmit() {
    if (saving) return;
    if (!id || !pathMeta.title.trim() || pathMeta.categoryId == null) return;
    setSaveError("");
    setSaving(true);
    try {
      const lpId = Number(id);
      const coverUrl = String(pathMeta.coverImageUrl || "").trim() || null;
      await updateMyLearningPath(lpId, {
        title: pathMeta.title,
        type: pathMeta.type,
        description: pathMeta.description,
        is_public: pathMeta.isPublic,
        cover_image_url: coverUrl,
        manual_weight: toManualWeight(pathMeta.manualWeight),
      });

      // Sync resources: delete original items then re-add all current selected
      for (const resourceId of originalItemIds) {
        try {
          await removeResourceFromMyLearningPath(lpId, resourceId);
        } catch {
          // ignore if already removed
        }
      }
      for (let i = 0; i < selected.length; i++) {
        await addResourceToMyLearningPath(lpId, {
          resource_id: selected[i].id,
          order_index: i + 1,
          is_optional: false,
          manual_weight: toManualWeight(pathMeta.manualWeight),
        });
      }

      navigate("/my-paths");
    } catch (e: any) {
      setSaveError(
        String(e?.response?.data?.detail || e?.message || "Save failed")
      );
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    pathMeta.title.trim() && pathMeta.categoryId != null && !saving;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="inline-flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm text-stone-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Edit
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Edit
                <br />
                <span className="text-amber-500">Learning Path.</span>
              </h1>
            </div>

            {/* User dropdown */}
            {isAuthed && (
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1.5 hover:border-stone-300 hover:bg-stone-50 transition-all"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user?.username || "User"}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (user?.username || "U").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-stone-400 transition-transform",
                      userMenuOpen ? "rotate-180" : ""
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-md border border-stone-100 bg-white shadow-xl z-50 py-1">
                      <div className="px-4 py-3 border-b border-stone-50 mb-1">
                        <p className="text-sm font-semibold text-stone-900">
                          {user?.username || "User"}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {user?.email || ""}
                        </p>
                      </div>
                      <div className="py-1">
                        {USER_MENU_ITEMS.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <item.icon className="w-4 h-4 text-stone-400" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-stone-50 mt-1 pt-1 pb-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                            navigate("/home");
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Top meta panel */}
        <section className="bg-white rounded-md border border-stone-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
              Path Details
            </h2>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left: inputs */}
            <div className="col-span-12 lg:col-span-7 space-y-5">
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
                  className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
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
                  className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-colors"
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
                      className="w-full h-10 px-3 pr-8 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer appearance-none"
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
                      className="w-full h-10 px-3 pr-8 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer appearance-none disabled:opacity-50"
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
                    pathMeta.isPublic ? "bg-amber-500" : "bg-stone-300"
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

            {/* Right: cover picker + weight */}
            <div className="col-span-12 lg:col-span-5">
              <CoverPicker
                coverImageUrl={pathMeta.coverImageUrl}
                defaultCoverUrls={defaultCoverUrls}
                uploadedCoverUrl={uploadedCoverUrl}
                onSelectCover={selectCover}
                onCoverFileChange={onCoverFileChange}
              />

              <div className="mt-4">
                <ManualWeight
                  value={pathMeta.manualWeight}
                  onChange={(weight) =>
                    setPathMeta((prev) => ({ ...prev, manualWeight: weight }))
                  }
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
            onAddResource={addResource}
            onDragStart={handleDragStart}
          />

          {/* Right: selected resources */}
          <ResourceSelected
            selected={selected}
            weight={pathMeta.manualWeight}
            accentColor="amber"
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
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-full bg-amber-500 text-white hover:bg-amber-600 font-semibold text-sm px-10 py-3 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-amber-500/20"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {saving ? "Saving…" : pathMeta.isForked ? "Publish →" : "Publish →"}
          </button>
        </div>
        {saveError && (
          <p className="text-sm text-red-500 text-right mt-2">{saveError}</p>
        )}
      </main>
    </div>
  );
}
