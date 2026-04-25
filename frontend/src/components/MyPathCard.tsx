import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";

export type PoolPath = {
  id: string;
  title: string;
  description: string;
  category: string;
  typeLabel: string;
  level: string;
  items?: number;
  thumbnail: string;
  hotScore?: number;
  forkCount?: number;
  source?: string;
  status?: string;
};

export type MyPoolPath = PoolPath;

interface MyPathCardProps {
  path: MyPoolPath;
  index?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showSource?: boolean;
  rightCategory?: string;
}

// Memphis color palette
const MEMPHIS_COLORS = [
  "#7c3aed", // purple
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#ca8a04", // yellow
  "#ea580c", // orange
  "#0891b2", // cyan
];

function getMemphisColor(index: number): string {
  return MEMPHIS_COLORS[index % MEMPHIS_COLORS.length];
}

export function MyPathCard({
  path,
  index = 0,
  onClick,
  onEdit,
  onDelete,
  showSource,
  rightCategory,
}: MyPathCardProps) {
  const color = getMemphisColor(index);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className="group block relative bg-white border-2 border-black rounded-memphis shadow-memphis hover:shadow-memphis-lg hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 overflow-hidden">
      {/* Decorative corner square */}
      <div
        className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45"
        style={{ backgroundColor: color }}
      />

      {/* Clickable area */}
      <Link
        to={`/learningpath/${path.id}`}
        onClick={handleClick}
        className="block"
      >
        {/* Thumbnail area */}
        <div className="relative aspect-video overflow-hidden bg-stone-100">
          {path.thumbnail ? (
            <img
              src={path.thumbnail}
              alt={path.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${path.id}/600/400`;
              }}
            />
          ) : (
            <img
              src={`https://picsum.photos/seed/${path.id}/600/400`}
              alt={path.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-5 relative z-10">
          {/* Category label */}
          <span
            className="inline-block px-3 py-1 text-xs font-black text-white rounded-memphis mb-3"
            style={{ backgroundColor: color }}
          >
            {rightCategory || path.category}
          </span>

          {/* Title */}
          <h3 className="text-base font-bold leading-snug text-black line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
            {path.title}
          </h3>

          {/* Meta info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-black/70">
              <span className="font-medium">{path.level}</span>
              <span className="text-black/30">·</span>
              <span>{path.items} items</span>
            </div>

            {path.hotScore !== undefined && path.hotScore > 0 && (
              <div className="flex items-center gap-1">
                <ArrowUp
                  className="w-4 h-4 text-white p-0.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-bold text-black/70">
                  {path.hotScore}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative wave line */}
        <svg
          className="absolute bottom-2 left-3 w-10 h-3"
          viewBox="0 0 40 12"
          style={{ opacity: 0.15 }}
        >
          <path
            d="M0 6 Q 5 0, 10 6 T 20 6 T 30 6 T 40 6"
            stroke="#0a0a0a"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </Link>

      {/* Action buttons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
              className="px-2 py-1 bg-white/90 backdrop-blur-sm border border-black/20 text-[10px] font-bold uppercase tracking-wider hover:bg-white hover:border-black transition-all"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="px-2 py-1 bg-red-50/90 backdrop-blur-sm border border-red-200 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 hover:border-red-300 transition-all"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
