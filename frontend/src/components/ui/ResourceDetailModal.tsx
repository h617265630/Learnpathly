import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { type UiResource } from "@/components/ResourceCard";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop";

function getCategoryColor(category?: string): string {
  const key = String(category || "").trim().toLowerCase() || "other";
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

function displayResourceType(r: UiResource): string {
  const t = r.resource_type?.toLowerCase() || r.typeLabel?.toLowerCase() || "";
  if (t.includes("video")) return "Video";
  if (t.includes("doc") || t.includes("pdf")) return "Document";
  if (t.includes("course")) return "Course";
  if (t.includes("repo")) return "Repository";
  return "Article";
}

interface ResourceDetailModalProps {
  resource: UiResource;
  onClose: () => void;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
  error?: string;
}

export function ResourceDetailModal({
  resource,
  onClose,
  onSave,
  saving = false,
  saved = false,
  error,
}: ResourceDetailModalProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (resource.url) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
      onClose();
      return;
    }
    const t = (resource.resource_type || resource.typeLabel || "").toLowerCase();
    const name =
      t.includes("video")
        ? "resource-video"
        : t.includes("doc") || t.includes("pdf")
        ? "resource-document"
        : "resource-article";
    onClose();
    navigate(`/resources/${name}/${resource.id}`);
  };

  const thumbnail = resource.thumbnail || FALLBACK_THUMB;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xs sm:max-w-sm md:max-w-md rounded-md overflow-hidden bg-white shadow-2xl border border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 rounded-sm bg-white flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image header */}
        <div
          className="relative bg-white overflow-hidden p-2"
          style={{ width: "100%", aspectRatio: "16 / 9" }}
        >
          <img
            src={thumbnail}
            alt={resource.title}
            className="block w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: getCategoryColor(resource.categoryLabel) + "18",
                  color: getCategoryColor(resource.categoryLabel),
                }}
              >
                {resource.categoryLabel || "Resource"}
              </span>
              <span className="text-[10px] text-stone-400">
                #{String(resource.id).padStart(3, "0")}
              </span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-stone-900 leading-tight line-clamp-4">
              {resource.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-stone-600 line-clamp-3 sm:line-clamp-none">
            {resource.summary || "No description available."}
          </p>

          <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs text-stone-400">
            <span>{resource.platformLabel}</span>
            <span className="text-stone-200">·</span>
            <span className="font-medium text-stone-600 uppercase text-[10px] tracking-wider">
              {displayResourceType(resource)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 flex flex-col gap-2">
          <Button
            onClick={handleViewDetails}
            className="w-full rounded-sm bg-stone-900 text-white hover:bg-stone-800 font-semibold text-xs sm:text-sm transition-all"
          >
            View details
          </Button>
          {onSave && (
            <Button
              variant="outline"
              onClick={onSave}
              disabled={saving || saved}
              className="w-full rounded-sm border border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900 font-semibold text-xs sm:text-sm transition-all"
            >
              {saved
                ? "Already saved"
                : saving
                ? "Saving…"
                : "+ Save to my resources"}
            </Button>
          )}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
