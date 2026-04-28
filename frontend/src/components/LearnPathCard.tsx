import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export type LearnPathProject = {
  id: number;
  topic: string;
  outline_overview?: string;
  created_at?: string;
  total_subnodes?: number;
  completed_subnodes?: number;
  is_complete?: boolean;
};

function coverUrl(id: number) {
  return `https://picsum.photos/seed/ai-path-${id}/900/506`;
}

export function LearnPathCard({ project }: { project: LearnPathProject }) {
  const totalSubnodes = Number(project.total_subnodes || 0);
  const completedSubnodes = Number(project.completed_subnodes || 0);

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

        {project.is_complete ? (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 shadow-sm backdrop-blur-sm">
            <CheckCircle2 className="h-3 w-3" />
            Complete
            {totalSubnodes > 0 ? (
              <span className="text-emerald-500">
                {completedSubnodes}/{totalSubnodes}
              </span>
            ) : null}
          </div>
        ) : null}

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
