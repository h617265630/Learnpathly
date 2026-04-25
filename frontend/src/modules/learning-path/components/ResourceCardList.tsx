import {
  type UiResource,
  type ResourceType,
} from "../utils/pathUtils";

function displayType(t: ResourceType): string {
  return t === "video"
    ? "Video"
    : t === "document"
    ? "Doc"
    : t === "article"
    ? "Article"
    : t === "clip"
    ? "Clip"
    : "Link";
}

export type ResourceCardListProps = {
  resources: UiResource[];
  selected?: UiResource[];
  onAddResource: (resource: UiResource) => void;
  onDragStart: (e: React.DragEvent, resource: UiResource) => void;
};

export function ResourceCardList({
  resources,
  selected = [],
  onAddResource,
  onDragStart,
}: ResourceCardListProps) {
  return (
    <div className="max-h-105 overflow-y-auto space-y-2 pr-1 mb-3">
      {resources.map((r) => (
        <div
          key={r.id}
          className={`group rounded-sm border bg-white transition-all cursor-pointer overflow-hidden ${
            selected.some((s) => s.id === r.id)
              ? "border-emerald-200 opacity-50"
              : "border-stone-100 hover:border-stone-200 hover:shadow-sm"
          }`}
          draggable={!selected.some((s) => s.id === r.id)}
          onDragStart={(e) =>
            !selected.some((s) => s.id === r.id) && onDragStart(e, r)
          }
          onClick={() =>
            !selected.some((s) => s.id === r.id) && onAddResource(r)
          }
        >
          <div className="flex gap-3 p-3">
            <div className="w-48 h-24 shrink-0 rounded-none overflow-hidden bg-stone-100">
              <img
                src={r.thumbnail}
                alt={r.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-bold text-stone-800 line-clamp-1 leading-snug">
                  {r.title}
                </h3>
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                  {displayType(r.type)}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                {r.summary}
              </p>
            </div>
          </div>
        </div>
      ))}
      {resources.length === 0 && (
        <p className="text-xs text-stone-400 text-center py-8">
          No resources found.
        </p>
      )}
    </div>
  );
}
