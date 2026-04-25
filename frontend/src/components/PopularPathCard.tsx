import { Link } from "react-router-dom";

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
};

interface PopularPathCardProps {
  path: PoolPath;
  index?: number;
}

export function PopularPathCard({ path }: PopularPathCardProps) {
  const isGitHub = path.thumbnail?.includes("github") || path.thumbnail?.includes("opengraph.githubassets.com");

  return (
    <Link
      to={`/learningpath/${path.id}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className={`relative aspect-video overflow-hidden bg-stone-100 ${isGitHub ? "p-1 bg-white" : ""}`}>
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
      <div className="p-4">
        {/* Category */}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-2 block">
          {path.category}
        </span>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug text-stone-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
          {path.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>{path.level}</span>
          <span className="text-stone-300">·</span>
          <span>{path.items} items</span>
        </div>
      </div>
    </Link>
  );
}
