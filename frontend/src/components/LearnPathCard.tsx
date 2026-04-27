import { Link } from "react-router-dom";

export type LearnPathProject = {
  id: number;
  topic: string;
  outline_overview?: string;
  created_at?: string;
};

function coverUrl(id: number) {
  return `https://picsum.photos/seed/ai-path-${id}/900/506`;
}

export function LearnPathCard({ project }: { project: LearnPathProject }) {
  return (
    <Link
      to={`/ai-path-detail?project_id=${project.id}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden bg-stone-100">
        <img
          src={coverUrl(project.id)}
          alt={project.topic}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        <div className="absolute left-4 right-4 bottom-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            AI Path
            <span className="text-white/60">·</span>
            #{String(project.id).padStart(3, "0")}
          </div>
          <h3 className="mt-3 text-xl md:text-2xl font-black tracking-tight text-white leading-[1.05] drop-shadow-sm line-clamp-2">
            {project.topic}
          </h3>
        </div>
      </div>

      {/* Meta */}
      <div className="p-4">
        <p className="text-xs text-stone-500 line-clamp-2">
          {project.outline_overview || "AI-generated outline and knowledge points."}
        </p>
      </div>
    </Link>
  );
}

