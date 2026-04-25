import { Badge } from "@/components/ui/Badge";
import type { UiResource } from "@/components/ResourceCard";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

interface CardHeroProps {
  resource: UiResource;
  onOpen: () => void;
  onAdd: () => void;
  saving: boolean;
  saved: boolean;
}

export function CardHero({
  resource,
  onOpen,
  onAdd,
  saving,
  saved,
}: CardHeroProps) {
  return (
    <article
      className="group border border-stone-300 bg-white hover:border-stone-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-500 overflow-hidden cursor-pointer flex flex-col sm:flex-row"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div
        className="relative bg-white overflow-hidden shrink-0 w-full sm:w-1/2"
        style={{ aspectRatio: "16 / 9" }}
      >
        <img
          src={resource.thumbnail || FALLBACK_THUMB}
          alt={resource.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1.5 sm:gap-2">
          <Badge
            variant="secondary"
            className="text-[9px] sm:text-[10px] uppercase tracking-wider"
          >
            Hero
          </Badge>
          <Badge className="text-[9px] sm:text-[10px] uppercase tracking-wider bg-white border-white/20">
            {resource.typeLabel}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2 sm:space-y-3">
          <span
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm"
            style={{
              backgroundColor: resource.categoryColor + "18",
              color: resource.categoryColor,
            }}
          >
            {resource.categoryLabel}
          </span>
          <h3
            className="text-sm sm:text-base md:text-lg font-bold text-stone-900 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors"
            title={resource.title}
          >
            {resource.title}
          </h3>
          <p className="text-xs sm:text-xs md:text-sm text-stone-500 line-clamp-2 sm:line-clamp-3">
            {resource.summary || "No description available."}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t border-stone-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-stone-400">
              {resource.platformLabel}
            </span>
            <span className="text-xs text-stone-300 hidden sm:inline">·</span>
            <span className="text-[10px] sm:text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              {resource.typeLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            disabled={saving || saved}
            className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors ${
              saved ? "text-emerald-500" : "text-amber-600 hover:text-amber-700"
            } disabled:opacity-50`}
          >
            {saved ? "Saved" : saving ? "Saving…" : "+ Add"}
          </button>
        </div>
      </div>
    </article>
  );
}
