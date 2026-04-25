import { Link } from "lucide-react";

export type PathTCardProps = {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  href?: string;
  index?: number;
};

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

export function PathTCard({
  id,
  title,
  category,
  thumbnail,
  href,
  index = 0,
}: PathTCardProps) {
  const color = getMemphisColor(index);
  const linkHref = href ?? `/learningpath/${id}`;

  return (
    <a
      className="group shrink-0 block bg-white border-2 border-black rounded-memphis shadow-memphis hover:shadow-memphis-lg hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 overflow-hidden relative"
      href={linkHref}
      data-discover="true"
    >
      {/* Decorative corner square */}
      <div
        className="absolute top-0 right-0 w-12 h-12 -mr-6 -mt-6 rotate-45"
        style={{ backgroundColor: color }}
      />

      {/* Thumbnail area */}
      <div className="relative h-28 overflow-hidden bg-stone-100">
        {thumbnail ? (
          <img
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            src={thumbnail}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${id}/400/225`;
            }}
          />
        ) : (
          <img
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            src={`https://picsum.photos/seed/${id}/400/225`}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-3 relative z-10">
        {/* Category label */}
        <span
          className="inline-block px-2 py-0.5 text-[10px] font-black text-white rounded-memphis mb-1"
          style={{ backgroundColor: color }}
        >
          {category}
        </span>

        {/* Title */}
        <h3 className="text-sm font-bold leading-snug text-black line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
          {title}
        </h3>
      </div>
    </a>
  );
}