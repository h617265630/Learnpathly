import { Link } from "lucide-react";

export type PathTCardProps = {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  href?: string;
  index?: number;
};

export function PathTCard({
  id,
  title,
  category,
  thumbnail,
  href,
  index = 0,
}: PathTCardProps) {
  const linkHref = href ?? `/learningpath/${id}`;

  return (
    <a
      className="group shrink-0 block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
      href={linkHref}
      data-discover="true"
    >
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
      <div className="p-3">
        {/* Category label */}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1 block">
          {category}
        </span>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug text-stone-900 line-clamp-2 group-hover:text-sky-600 transition-colors">
          {title}
        </h3>
      </div>
    </a>
  );
}
