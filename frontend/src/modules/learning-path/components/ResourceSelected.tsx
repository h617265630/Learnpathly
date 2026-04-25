import { ResourceCard } from "@/components/ResourceCard";
import { type UiResource, toCardResource } from "../utils/pathUtils";

export type ResourceSelectedProps = {
  selected: UiResource[];
  weight?: string;
  accentColor?: string;
  showOrderBadge?: boolean;
  onClearAll: () => void;
  onRemove: (id: number) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, id: number, idx: number) => void;
  onDragEnd: () => void;
  onDragOver: (idx: number) => void;
  onDropItem: (e: React.DragEvent, idx: number) => void;
};

export function ResourceSelected({
  selected,
  weight,
  accentColor = "sky",
  showOrderBadge = true,
  onClearAll,
  onRemove,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDropItem,
}: ResourceSelectedProps) {
  const colorMap: Record<string, string> = {
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  };
  const colorClass = colorMap[accentColor] ?? colorMap.sky;

  return (
    <div className="col-span-12 lg:col-span-6">
      <div
        className={`bg-white rounded-md p-5 h-full ${
          selected.length > 0
            ? "border border-stone-100"
            : "border border-dashed border-stone-100"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-5 ${colorClass} rounded-full`} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
              Selected
            </h2>
            {selected.length > 0 && (
              <span className="text-xs text-stone-400">
                {selected.length} items
              </span>
            )}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 hover:text-red-500 transition-colors"
              onClick={onClearAll}
            >
              Clear all
            </button>
          )}
        </div>

        {selected.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <p className="text-sm text-stone-400 mt-2">
              Click a resource or drag it here
            </p>
          </div>
        ) : (
          <div className="max-h-150 overflow-y-auto mb-3 grid grid-cols-3 gap-3">
            {selected.map((r, idx) => (
              <div
                key={r.id}
                className="relative group overflow-hidden rounded-md"
              >
                {/* Order badge */}
                {showOrderBadge && (
                  <div className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-stone-900/80 text-white flex items-center justify-center">
                    <span className="text-[9px] font-bold">{idx + 1}</span>
                  </div>
                )}
                {/* Card (draggable) */}
                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, r.id, idx)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => {
                    e.preventDefault();
                    onDragOver(idx);
                  }}
                  onDrop={(e) => onDropItem(e, idx)}
                >
                  <ResourceCard
                    resource={toCardResource(r)}
                    onOpen={() => {}}
                    onAdd={() => {}}
                    saving={false}
                    saved={false}
                    weight={weight}
                    size="sm"
                    onRemove={onRemove}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
