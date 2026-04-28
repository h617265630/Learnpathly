import { Badge } from "@/components/ui/Badge";
import { X } from "lucide-react";
import "./card-ui.css";

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

export type UiResource = {
  id: number;
  title: string;
  summary: string;
  categoryLabel: string;
  categoryColor: string;
  platform: string;
  platformLabel: string;
  typeLabel: string;
  thumbnail: string;
  resource_type: string;
  url?: string;
};

interface ResourceCardProps {
  resource: UiResource;
  onOpen: () => void;
  onAdd: () => void;
  saving: boolean;
  saved: boolean;
  weight?: string; // e.g. 'default', 'tier-gold', 'gradient-emerald', 'glass-purple'
  /** @deprecated Use size=\"sm\" instead. Kept for backward compatibility. */
  compact?: boolean;
  /** Size variant: sm = selected panel, md = resource library, lg = live preview */
  size?: "sm" | "md" | "lg";
  onRemove?: (id: number) => void;
}

// Maps weight values to CardUI CSS classes
function getCardWeightClass(weight?: string): string {
  if (!weight) return "border border-stone-200 bg-stone-50";

  // Tier styles
  if (weight === "tier-gold") return "tier-gold";
  if (weight === "tier-diamond") return "tier-diamond";
  if (weight === "tier-prismatic") return "tier-prismatic";
  if (weight === "tier-obsidian") return "tier-obsidian";

  // Gradient styles
  if (weight.startsWith("gradient-")) return `gradient-card ${weight}`;

  // Neumorphism
  if (weight === "neu") return "neu-card";

  // Holographic
  if (weight === "holo") return "holo-card";

  // Sketch
  if (weight === "sketch") return "sketch-card";

  // Newspaper
  if (weight === "newspaper") return "newspaper-card";

  // Neon styles
  if (weight.startsWith("neon-")) return `neon-card-${weight.split("-")[1]}`;

  // Metallic styles
  if (weight.startsWith("metallic-")) return `metallic-card ${weight}`;

  // Papercut styles
  if (weight.startsWith("papercut-")) return `papercut-card ${weight}`;

  // Default (default/iron/bronze/silver/gold/diamond/prismatic/obsidian)
  const basicMap: Record<string, string> = {
    default: "border border-stone-200 bg-stone-50",
    iron: "border border-slate-300 bg-slate-50",
    bronze: "border-2 border-sky-400 bg-sky-50",
    silver:
      "border-2 border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100",
    gold: "tier-gold",
    diamond: "tier-diamond",
    prismatic: "tier-prismatic",
    obsidian: "tier-obsidian",
  };

  return basicMap[weight] || "border border-stone-200 bg-stone-50";
}

function displayTitle(title: string, platform?: string): string {
  if (platform === "github") {
    const afterSlash = title.split("/").pop() || title;
    const afterDash = afterSlash.replace(/^GitHub\s*-\s*/i, "");
    return afterDash.split(":")[0];
  }
  return title;
}

export function ResourceCard({
  resource,
  onOpen,
  onAdd,
  saving,
  saved,
  weight,
  compact,
  size,
  onRemove,
}: ResourceCardProps) {
  const resolvedSize = compact ? "sm" : (size ?? "md");
  const weightClass = getCardWeightClass(weight);
  const isGradient = weight?.startsWith("gradient-");
  const title = displayTitle(resource.title, resource.platform);

  if (resolvedSize === "sm") {
    return (
      <article
        className={`w-full h-56 cursor-pointer overflow-hidden rounded-none ${weightClass} ${
          isGradient ? "p-0.5" : ""
        }`}
        onClick={onOpen}
      >
        <div
          className={`h-full flex flex-col overflow-hidden ${
            isGradient ? "bg-white rounded-none" : ""
          }`}
        >
          {/* Header */}
          <div className="h-7 px-2 sm:px-3 flex shrink-0 items-center justify-between border-b border-black/10 relative">
            <span className="min-w-0 flex-1 truncate text-[9px] font-bold uppercase tracking-wider text-stone-600">
              {resource.categoryLabel}
            </span>
            <div className="ml-2 flex shrink-0 items-center gap-0.5 sm:gap-1">
              <span className="text-[9px] text-stone-400">
                #{String(resource.id).padStart(3, "0")}
              </span>
              {onRemove && (
                <button
                  type="button"
                  className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(resource.id);
                  }}
                  aria-label="Remove"
                >
                  <X className="w-2 sm:w-2.5" />
                </button>
              )}
            </div>
          </div>
          {/* Thumbnail */}
          <div className="relative h-16 shrink-0 bg-stone-100 overflow-hidden z-10 p-1">
            {resource.thumbnail ? (
              <img
                src={resource.thumbnail}
                alt={resource.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full rounded-[3px] object-cover object-center"
              />
            ) : (
              <div className="w-full h-full rounded-[3px] bg-linear-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                <span className="text-2xl font-black text-stone-300">
                  {title.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {/* Title */}
          <div className="h-8 px-2 sm:px-3 border-b border-black/10 bg-white flex shrink-0 items-center">
            <h3 className="min-w-0 truncate text-xs font-bold text-stone-900">
              {title}
            </h3>
          </div>
          {/* Summary */}
          <div className="px-2 sm:px-3 py-2 flex-1 overflow-hidden bg-stone-50">
            <p className="text-[10px] leading-4 text-stone-400 line-clamp-4">
              {resource.summary || "No description available."}
            </p>
          </div>
          {/* Footer */}
          <div className="h-8 px-2 sm:px-3 border-t border-black/10 flex shrink-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[10px] text-stone-400">
              {resource.platformLabel}
            </span>
            <span className="shrink-0 truncate text-[10px] font-medium text-stone-500">
              {resource.typeLabel}
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (resolvedSize === "lg") {
    return (
      <article
        className={`w-full h-96 ${
          isGradient ? "rounded-lg" : "rounded-md"
        } shadow-sm cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden ${weightClass} ${
          isGradient ? "p-0.5" : ""
        }`}
        onClick={onOpen}
      >
        <div
          className={`h-full flex flex-col overflow-hidden relative ${
            isGradient ? "bg-white rounded-md" : ""
          }`}
          style={{ zIndex: 1 }}
        >
          {/* Header */}
          <div className="h-9 px-4 flex shrink-0 items-center justify-between border-b border-black/10">
            <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-stone-600">
              {resource.categoryLabel}
            </span>
            <span className="ml-3 shrink-0 text-xs text-stone-400">
              #{String(resource.id).padStart(3, "0")}
            </span>
          </div>

          {/* Thumbnail */}
          <div className="relative h-40 shrink-0 bg-stone-100 overflow-hidden z-10 p-1">
            {resource.thumbnail ? (
              <img
                src={resource.thumbnail}
                alt={resource.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full rounded-[3px] object-cover object-center"
              />
            ) : (
              <div className="w-full h-full rounded-[3px] bg-stone-200 flex items-center justify-center text-xl font-bold text-stone-500">
                {title.charAt(0)}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="h-11 px-4 border-b border-black/10 bg-white flex shrink-0 items-center">
            <h3 className="min-w-0 truncate text-base font-bold text-stone-900">
              {title}
            </h3>
          </div>

          {/* Summary */}
          <div className="px-4 py-3 flex-1 overflow-hidden bg-stone-50">
            <p className="text-sm leading-5 text-stone-500 line-clamp-4">
              {resource.summary || "No description available."}
            </p>
          </div>

          {/* Footer */}
          <div className="h-10 px-4 border-t border-black/10 flex shrink-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-stone-400">
              {resource.platformLabel}
            </span>
            <span className="shrink-0 truncate text-sm font-medium text-stone-600">
              {resource.typeLabel}
            </span>
          </div>
        </div>
      </article>
    );
  }

  // md (default)
  return (
    <>
      <article
        className={`w-full h-80 ${
          isGradient ? "rounded-lg" : "rounded-md"
        } shadow-sm cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden ${weightClass} ${
          isGradient ? "p-0.5" : ""
        }`}
        onClick={onOpen}
      >
        {/* Inner content - matches CardUI CardInner structure */}
        <div
          className={`h-full flex flex-col overflow-hidden relative ${
            isGradient ? "bg-white rounded-md" : ""
          }`}
          style={{ zIndex: 1 }}
        >
          {/* Header: Category + ID */}
          <div className="h-8 px-3 flex shrink-0 items-center justify-between border-b border-black/10">
            <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-stone-600">
              {resource.categoryLabel}
            </span>
            <span className="ml-3 shrink-0 text-xs text-stone-400">
              #{String(resource.id).padStart(3, "0")}
            </span>
          </div>

          {/* Thumbnail */}
          <div className="relative h-32 shrink-0 bg-stone-100 overflow-hidden z-10 p-1">
            {resource.thumbnail ? (
              <img
                src={resource.thumbnail}
                alt={resource.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full rounded-[3px] object-cover object-center"
              />
            ) : (
              <div className="w-full h-full rounded-[3px] bg-stone-200 flex items-center justify-center text-lg font-bold text-stone-500">
                {resource.title.charAt(0)}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="h-9 px-3 border-b border-black/10 bg-white flex shrink-0 items-center">
            <h3 className="min-w-0 truncate text-sm font-bold text-stone-900">
              {title}
            </h3>
          </div>

          {/* Summary */}
          <div className="px-3 py-2 flex-1 overflow-hidden bg-stone-50">
            <p className="text-xs leading-5 text-stone-500 line-clamp-4">
              {resource.summary || "No description available."}
            </p>
          </div>

          {/* Footer: Platform + Type */}
          <div className="h-8 px-3 border-t border-black/10 flex shrink-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate text-xs text-stone-400">
              {resource.platformLabel}
            </span>
            <span className="shrink-0 truncate text-xs font-medium text-stone-600">
              {resource.typeLabel}
            </span>
          </div>
        </div>
      </article>
    </>
  );
}
