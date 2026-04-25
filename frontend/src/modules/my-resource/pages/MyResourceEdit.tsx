import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  ResourceCard,
  type UiResource as RcResource,
} from "@/components/ResourceCard";
import { getMyResourceDetail, updateMyResource } from "@/services/resource";
import { listCategories, type Category } from "@/services/category";
import { formatPlatform } from "@/lib/platform";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

const WEIGHT_OPTIONS = [
  // Tier styles
  { value: "tier-gold", label: "Tier Gold" },
  { value: "tier-diamond", label: "Tier Diamond" },
  { value: "tier-prismatic", label: "Tier Prismatic" },
  { value: "tier-obsidian", label: "Tier Obsidian" },
  // Gradient styles
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

function getWeightCardClass(weight: number | null | undefined) {
  const w = Number(weight);
  // Tier (1-4)
  if (w >= 1 && w <= 4)
    return `weight-tier-${["gold", "diamond", "prismatic", "obsidian"][w - 1]}`;
  // Gradient (5-9)
  if (w >= 5 && w <= 9)
    return `weight-gradient-${
      ["emerald", "sapphire", "ruby", "amethyst", "gold"][w - 5]
    }`;
  // Special (10-13)
  if (w === 10) return "weight-neu";
  if (w === 11) return "weight-holo";
  if (w === 12) return "weight-sketch";
  if (w === 13) return "weight-newspaper";
  // Neon (14-18)
  if (w >= 14 && w <= 18)
    return `weight-neon-${["cyan", "pink", "green", "purple", "gold"][w - 14]}`;
  // Metallic (19-23)
  if (w >= 19 && w <= 23)
    return `weight-metallic-${
      ["steel", "copper", "titanium", "rose-gold", "gunmetal"][w - 19]
    }`;
  // Papercut (24-28)
  if (w >= 24 && w <= 28)
    return `weight-papercut-${
      ["coral", "sky", "mint", "lavender", "peach"][w - 24]
    }`;
  // Default
  return "weight-default";
}

function getWeightPreviewClass(w: string) {
  if (w.startsWith("tier-"))
    return "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50";
  if (w.startsWith("gradient-"))
    return "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50";
  if (["neu", "holo", "sketch"].includes(w))
    return "border-gray-300 bg-gray-100";
  if (w === "newspaper")
    return "border-black bg-gradient-to-br from-stone-100 to-white";
  if (w.startsWith("neon-")) return "border-cyan-400 bg-gray-900";
  if (w.startsWith("metallic-"))
    return "border-gray-400 bg-gradient-to-br from-gray-200 to-gray-300";
  if (w.startsWith("papercut-"))
    return "border-orange-300 bg-gradient-to-br from-orange-50 to-red-50";
  return "border-stone-200 bg-stone-50";
}

function getWeightTextClass(w: string) {
  if (w.startsWith("neon-")) return "text-green-400";
  if (w === "newspaper") return "text-black";
  if (w.startsWith("metallic-")) return "text-gray-600";
  return "text-stone-600";
}

export default function MyResourceEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [platform, setPlatform] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [manualWeight, setManualWeight] = useState("");
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedWeight = manualWeight || "default";
  const weightPreviewClass = getWeightPreviewClass(selectedWeight);
  const weightTextClass = getWeightTextClass(selectedWeight);

  const previewResource: RcResource = {
    id: Number(id) || 0,
    title: title || "Untitled",
    summary: summary || "No description",
    categoryLabel: categoryName || "Other",
    categoryColor: getCategoryColor(categoryName),
    platform: platform || "",
    platformLabel: formatPlatform(platform),
    typeLabel: resourceType || "video",
    thumbnail: thumbnail || FALLBACK_THUMB,
    resource_type: resourceType || "video",
  };

  // Load categories
  useEffect(() => {
    listCategories()
      .then((cats) => setDbCategories(cats || []))
      .catch(() => setDbCategories([]));
  }, []);

  // Load existing resource
  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const r = await getMyResourceDetail(Number(id));
        setTitle(String(r.title || ""));
        setSummary(String((r as any).summary || ""));
        setThumbnail(String(r.thumbnail || ""));
        setPlatform(String(r.platform || ""));
        setResourceType(String(r.resource_type || "video"));
        setCategoryName(String((r as any).category_name || "Other"));
        setIsPublic(Boolean((r as any).is_system_public));
        setManualWeight(fromManualWeight((r as any).manual_weight));
        // Try to match category ID
        const cats: Category[] = dbCategories.length
          ? dbCategories
          : await listCategories();
        const match = cats?.find(
          (c: Category) =>
            String(c.name).toLowerCase() ===
            String((r as any).category_name || "").toLowerCase()
        );
        if (match) setCategoryId(String(match.id));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function handleSubmit() {
    console.log("handleSubmit called", {
      id,
      title,
      titleTrimmed: title.trim(),
      selectedWeight,
      manual_weight: toManualWeight(selectedWeight),
    });
    if (!id || !title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload: Parameters<typeof updateMyResource>[1] = {
        title: title.trim(),
        summary: summary.trim() || null,
        manual_weight: toManualWeight(selectedWeight),
        is_public: isPublic,
      };

      console.log("Sending payload:", payload);
      await updateMyResource(Number(id), payload);
      console.log("Save success, navigating...");
      navigate("/my-resources");
    } catch (e: any) {
      console.error("Save failed:", e);
      setError(
        String(e?.response?.data?.detail || e?.message || "Save failed")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
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
                <span className="h-px w-8 bg-violet-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Edit
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Edit
                <br />
                <span className="text-violet-600">Resource.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Main grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left: form */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Source info (read-only) */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-stone-300 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
                  Source
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Platform
                  </label>
                  <p className="text-sm font-semibold text-stone-700">
                    {formatPlatform(platform) || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Type
                  </label>
                  <p className="text-sm font-semibold text-stone-700 capitalize">
                    {resourceType || "video"}
                  </p>
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Thumbnail
                </label>
                <div className="relative aspect-video w-full max-w-sm rounded-none overflow-hidden bg-stone-100">
                  {thumbnail && thumbnail.trim() ? (
                    <img
                      src={thumbnail}
                      alt={title || "thumbnail"}
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
            </div>

            {/* Title & Summary */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-violet-600 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
                  Details
                </h2>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-stone-300 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
                  Options
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category (read-only display) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Category
                  </label>
                  <p className="text-sm font-semibold text-stone-700">
                    {categoryName || "Other"}
                  </p>
                </div>

                {/* Visibility toggle */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className="relative inline-flex h-8 w-28 items-center rounded-full border border-stone-200 bg-stone-50 p-0.5 transition-colors"
                    aria-label="Toggle privacy"
                  >
                    <span
                      className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.25rem)] rounded-full shadow-sm transition-transform duration-200 bg-indigo-400"
                      style={{
                        transform: isPublic
                          ? "translateX(56px)"
                          : "translateX(0px)",
                      }}
                    />
                    <span className="relative z-10 flex w-full text-[11px] font-semibold">
                      <span
                        className={`flex w-1/2 justify-center ${
                          isPublic ? "text-stone-400" : "text-white"
                        }`}
                      >
                        Private
                      </span>
                      <span
                        className={`flex w-1/2 justify-center ${
                          isPublic ? "text-white" : "text-stone-400"
                        }`}
                      >
                        Public
                      </span>
                    </span>
                  </button>
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
                      onClick={() => setManualWeight(w.value)}
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
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-none"
                onClick={() => navigate("/my-resources")}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-violet-600 text-white hover:bg-violet-700 font-semibold text-sm px-8 py-2.5 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!title.trim() || saving}
                onClick={handleSubmit}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500 text-right">{error}</p>
            )}
          </div>

          {/* Right: live preview */}
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Live preview
                </span>
              </div>
              {/* Card preview container - centered */}
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
    </div>
  );
}
