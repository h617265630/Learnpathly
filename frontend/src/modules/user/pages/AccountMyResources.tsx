import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { listMyResources, type DbResource } from "@/services/resource";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop";

type UiResource = {
  id: number;
  title: string;
  description: string;
  source: string;
  thumbnail: string;
};

function mapDb(r: DbResource): UiResource {
  const anyR = r as any;
  return {
    id: r.id,
    title: r.title,
    description: String(anyR.summary || anyR.description || "").trim(),
    source: String(anyR.platform || anyR.source || "").trim() || "—",
    thumbnail:
      String(anyR.thumbnail || anyR.thumbnail_url || "").trim() ||
      FALLBACK_THUMB,
  };
}

export default function AccountMyResources() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<UiResource[]>([]);

  useEffect(() => {
    setLoading(true);
    listMyResources()
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
        i.source.toLowerCase().includes(query)
    );
  }, [items, q]);

  const open = (id: number) => {
    navigate(`/my-resources/video/${id}`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-stone-400">
          <div className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-amber-500 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-md border border-stone-100">
        <div className="text-4xl mb-3">📚</div>
        <h3 className="text-sm font-bold text-stone-700 mb-1">
          No resources yet
        </h3>
        <p className="text-xs text-stone-400 mb-5">
          Start building your personal knowledge library.
        </p>
        <button
          onClick={() => navigate("/resources")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all rounded-sm"
        >
          Browse Resources →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search my resources…"
          aria-label="Search my resources"
          className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all rounded-sm"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <article
            key={r.id}
            onClick={() => open(r.id)}
            className="group bg-white rounded-md border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="relative aspect-video bg-stone-100 overflow-hidden">
              <img
                src={r.thumbnail}
                alt={r.title}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="inline-flex items-center rounded-sm border border-white/20 bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  {r.source}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              <h3 className="text-sm font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
                {r.title}
              </h3>
              <p className="text-xs text-stone-400 line-clamp-2">
                {r.description || "—"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
