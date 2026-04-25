import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  listMyLearningPaths,
  type MyLearningPath,
} from "@/services/learningPath";

const LOGO_FALLBACK_THUMB = "/favicon.png";

type UiPath = {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  thumbnail: string;
  status?: string | null;
  forkCount?: number;
};

function mapDb(p: MyLearningPath): UiPath {
  const anyP = p as any;
  return {
    id: Number(p.id),
    title: String(p.title || "").trim(),
    description: String(p.description || "").trim(),
    type: String(anyP.type || "").trim(),
    category: String(anyP.category_name || "").trim(),
    thumbnail: String(anyP.cover_image_url || "").trim() || LOGO_FALLBACK_THUMB,
    status: anyP.status ?? null,
    forkCount:
      typeof anyP.fork_count === "number" ? anyP.fork_count : undefined,
  };
}

export default function AccountMyPaths() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<UiPath[]>([]);

  useEffect(() => {
    setLoading(true);
    listMyLearningPaths()
      .then((data) => {
        setItems((data || []).map(mapDb));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query) ||
        i.type.toLowerCase().includes(query)
    );
  }, [items, q]);

  const open = (id: number) => {
    navigate(`/learningpath/${id}?from=my-paths`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-stone-400">
          <div className="w-4 h-4 rounded-sm border-2 border-stone-300 border-t-amber-500 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-md border border-stone-100">
        <div className="text-4xl mb-3">🛤️</div>
        <h3 className="text-sm font-bold text-stone-700 mb-1">No paths yet</h3>
        <p className="text-xs text-stone-400 mb-5">
          Build your first structured learning path.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate("/createpath")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all rounded-sm"
          >
            Create Path
          </button>
          <button
            onClick={() => navigate("/learningpool")}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone-200 text-stone-600 text-xs font-semibold hover:border-stone-300 hover:bg-stone-50 transition-all rounded-sm"
          >
            Browse Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + create */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search my paths…"
            aria-label="Search my paths"
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all rounded-sm"
          />
        </div>
        <button
          onClick={() => navigate("/createpath")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all hover:-translate-y-px active:translate-y-0 rounded-sm shrink-0"
        >
          + New Path
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <article
            key={p.id}
            onClick={() => open(p.id)}
            className="group bg-white rounded-md border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="relative aspect-video bg-stone-100 overflow-hidden">
              <img
                src={p.thumbnail}
                alt={p.title}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5">
                {p.category && (
                  <span className="inline-flex items-center rounded-sm border border-white/20 bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    {p.category}
                  </span>
                )}
                {p.type && (
                  <span className="inline-flex items-center rounded-sm border border-white/20 bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    {p.type}
                  </span>
                )}
                {p.status === "published" && (
                  <span className="inline-flex items-center rounded-sm bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Published
                  </span>
                )}
                {p.status === "draft" && (
                  <span className="inline-flex items-center rounded-sm bg-stone-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Draft
                  </span>
                )}
                {p.status === "archived" && (
                  <span className="inline-flex items-center rounded-sm bg-red-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Archived
                  </span>
                )}
                {p.forkCount !== undefined && p.forkCount > 0 && (
                  <span className="inline-flex items-center rounded-sm border border-white/20 bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold tracking-wider text-white">
                    ↳ {p.forkCount} fork{p.forkCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              <h3 className="text-sm font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
                {p.title}
              </h3>
              <p className="text-xs text-stone-400 line-clamp-2">
                {p.description || "—"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
