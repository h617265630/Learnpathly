import { Search } from "lucide-react";
import { type UiResource } from "../utils/pathUtils";
import { ResourceCardList } from "./ResourceCardList";

export type ResourceListProps = {
  allResources: UiResource[];
  selected?: UiResource[];
  searchQuery?: string;
  filteredResources?: UiResource[];
  onSearchChange?: (query: string) => void;
  onAddResource: (resource: UiResource) => void;
  onDragStart: (e: React.DragEvent, resource: UiResource) => void;
};

export function ResourceList({
  allResources,
  selected = [],
  searchQuery = "",
  filteredResources: externalFiltered,
  onSearchChange,
  onAddResource,
  onDragStart,
}: ResourceListProps) {
  const filteredResources = externalFiltered ?? (
    searchQuery.trim()
      ? allResources.filter(
          (r) =>
            r.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            r.summary.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
      : allResources
  );

  const showSearch = onSearchChange !== undefined;

  return (
    <div className="col-span-12 lg:col-span-6">
      <div className="bg-white rounded-md border border-stone-100 p-5 h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">
              Resources
            </h2>
          </div>
          <span className="text-xs text-stone-400">
            {filteredResources.length} available
          </span>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search your resources..."
              className="h-10 w-full pl-10 pr-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
            />
          </div>
        )}

        {/* Resource list */}
        <ResourceCardList
          resources={filteredResources}
          selected={selected}
          onAddResource={onAddResource}
          onDragStart={onDragStart}
        />
      </div>
    </div>
  );
}
