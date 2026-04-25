import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import {
  listPublicLearningPaths,
  mapPublicLearningPathToDisplayBase,
  type PublicLearningPath,
} from "@/services/learningPath";
import { Button } from "@/components/ui/Button";
import { PathCard, type PoolPath } from "@/components/PathCard";
import { PathTCard } from "@/components/PathTCard";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop";

function inferCategoryFromText(text: string): string {
  const t = text.toLowerCase();
  if (
    t.includes("ai") ||
    t.includes("llm") ||
    t.includes("rag") ||
    t.includes("gpt") ||
    t.includes("agent") ||
    t.includes("claude") ||
    t.includes("gemini")
  )
    return "AI";
  if (
    t.includes("front") ||
    t.includes("vue") ||
    t.includes("react") ||
    t.includes("css") ||
    t.includes("tailwind") ||
    t.includes("html")
  )
    return "Frontend";
  if (
    t.includes("back") ||
    t.includes("api") ||
    t.includes("fastapi") ||
    t.includes("node") ||
    t.includes("django") ||
    t.includes("flask") ||
    t.includes("spring")
  )
    return "Backend";
  if (
    t.includes("devops") ||
    t.includes("docker") ||
    t.includes("k8s") ||
    t.includes("kubernetes") ||
    t.includes("ci") ||
    t.includes("cicd") ||
    t.includes("aws") ||
    t.includes("cloud")
  )
    return "DevOps";
  if (
    t.includes("db") ||
    t.includes("sql") ||
    t.includes("database") ||
    t.includes("postgres") ||
    t.includes("mysql") ||
    t.includes("mongodb") ||
    t.includes("redis")
  )
    return "Database";
  if (
    t.includes("design") ||
    t.includes("figma") ||
    t.includes("ux") ||
    t.includes("ui") ||
    t.includes("sketch")
  )
    return "Design";
  if (
    t.includes("product") ||
    t.includes("pm") ||
    t.includes("roadmap") ||
    t.includes("agile") ||
    t.includes("scrum")
  )
    return "Product";
  if (
    t.includes("career") ||
    t.includes("resume") ||
    t.includes("interview") ||
    t.includes("job")
  )
    return "Career";
  if (
    t.includes("mobile") ||
    t.includes("ios") ||
    t.includes("android") ||
    t.includes("swift") ||
    t.includes("kotlin")
  )
    return "Mobile";
  if (
    t.includes("security") ||
    t.includes("cyber") ||
    t.includes("penetration") ||
    t.includes("owasp")
  )
    return "Security";
  if (
    t.includes("blockchain") ||
    t.includes("web3") ||
    t.includes("solidity") ||
    t.includes("nft")
  )
    return "Blockchain";
  if (
    t.includes("data") ||
    t.includes("analytics") ||
    t.includes("ml") ||
    t.includes("statistics") ||
    t.includes("python")
  )
    return "Data Science";
  if (
    t.includes("game") ||
    t.includes("unity") ||
    t.includes("unreal") ||
    t.includes("blender")
  )
    return "Gaming";
  return "Other";
}

function mapDbToPool(p: PublicLearningPath): PoolPath {
  const base = mapPublicLearningPathToDisplayBase(p);
  const lpType = String(p.type || "")
    .trim()
    .toLowerCase();
  let typeLabel = "Path";
  if (lpType.includes("linear")) typeLabel = "Linear";
  else if (lpType.includes("struct")) typeLabel = "Structured";
  else if (lpType.includes("partical") || lpType.includes("pool"))
    typeLabel = "Pool";

  const title = base.title;
  const description = base.description;
  const cat =
    base.categoryName || inferCategoryFromText(`${title}\n${description}`);
  const thumbnail = base.thumbnail || FALLBACK_THUMB;

  return {
    id: base.id,
    title,
    description: description || "（无介绍）",
    category: cat || "Other",
    typeLabel,
    level: "Beginner",
    items: base.itemCount,
    thumbnail,
    hotScore: 50,
    forkCount: base.forkCount,
  };
}

function SkeletonCard() {
  return (
    <div className="border border-stone-100 bg-white rounded-md overflow-hidden animate-pulse">
      <div
        className="bg-stone-100"
        style={{ width: "100%", aspectRatio: "16 / 9" }}
      />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-stone-100 rounded w-1/3" />
        <div className="h-4 bg-stone-100 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-full" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 bg-stone-100 rounded w-16" />
          <div className="h-5 bg-stone-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default function LearningPool() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);

  const [allPaths, setAllPaths] = useState<PoolPath[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("");
  const [activeType, setActiveType] = useState("all");

  useEffect(() => {
    setLoading(true);
    listPublicLearningPaths()
      .then((res) => {
        const paths = (res || []).map(mapDbToPool);
        setAllPaths(paths);
      })
      .catch(() => {
        setAllPaths([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sync search input with URL param
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(allPaths.map((p) => p.category));
    return Array.from(cats).sort();
  }, [allPaths]);

  const typeTabs = useMemo(
    () => [
      { key: "all", label: "All", count: allPaths.length },
      {
        key: "linear",
        label: "Linear",
        count: allPaths.filter((p) => p.typeLabel === "Linear").length,
      },
      {
        key: "structured",
        label: "Structured",
        count: allPaths.filter((p) => p.typeLabel === "Structured").length,
      },
      {
        key: "pool",
        label: "Pool",
        count: allPaths.filter((p) => p.typeLabel === "Pool").length,
      },
    ],
    [allPaths]
  );

  const hotPaths = useMemo(
    () => [...allPaths].sort(() => Math.random() - 0.5).slice(0, 8),
    [allPaths]
  );

  const filteredPaths = useMemo(() => {
    let result = allPaths;

    if (activeType !== "all") {
      result = result.filter((p) => p.typeLabel.toLowerCase() === activeType);
    }

    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allPaths, activeCategory, activeType, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value) {
      setSearchParams({ search: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 -mt-4 md:-mt-6 bg-gray-50">
      {/* Page header */}
      <section className="mb-12">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500 mb-3 block">
              LearningPool
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 leading-[1.1] font-serif">
              Discover learning paths
            </h1>
            <p className="mt-3 text-sm text-stone-500 leading-relaxed max-w-lg">
              Browse curated paths across topics. Follow a structured path, or
              explore a flexible pool of resources at your own pace.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 flex items-center gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="search"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search paths..."
                aria-label="Search learning paths"
                className="w-full rounded-full border border-stone-200 bg-white pl-9 pr-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
            <Button
              asChild
              to="/createpath"
              className="rounded-full bg-stone-900 text-white hover:bg-stone-800 px-5 py-2.5 text-xs font-semibold"
            >
              <>
                <Plus className="w-3.5 h-3.5" />
                New path
              </>
            </Button>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="mb-10">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveCategory("")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
              activeCategory === ""
                ? "bg-stone-900 text-white border-stone-900"
                : "border-stone-200 text-stone-500 bg-white hover:border-stone-300 hover:text-stone-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                activeCategory === cat
                  ? "bg-stone-900 text-white border-stone-900"
                  : "border-stone-200 text-stone-500 bg-white hover:border-stone-300 hover:text-stone-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Trending / Hot picks: horizontal scrollable strip */}
      {searchQuery === "" && hotPaths.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-500">
                Trending now
              </span>
            </div>
            <span className="text-xs text-stone-400">
              {hotPaths.length} paths
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {hotPaths.map((p, idx) => (
              <PathTCard
                key={p.id}
                id={String(p.id)}
                title={p.title}
                category={p.category}
                thumbnail={p.thumbnail || FALLBACK_THUMB}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}

      {/* Banner */}
      {searchQuery === "" && (
        <section className="mb-14">
          <div className="relative h-48 md:h-64 bg-stone-900 rounded-memphis overflow-hidden border-4 border-black shadow-memphis">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop"
              alt="Learning banner"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-serif">
                Discover your learning path
              </h2>
              <p className="text-sm text-white/80 mb-4 max-w-md">
                Browse curated paths or generate your own with AI
              </p>
              <Link
                to="/ai-path"
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 text-sm font-bold rounded-memphis hover:bg-blue-400 transition-colors"
              >
                Try AI Path Generator
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Type tabs */}
      {searchQuery === "" && (
        <section className="mb-8">
          <div className="border-b border-stone-100 flex items-center gap-0">
            {typeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveType(tab.key)}
                className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-150 -mb-px ${
                  activeType === tab.key
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-200"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] font-medium text-stone-300">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Filtered results count */}
      {searchQuery !== "" && (
        <section className="mb-6">
          <p className="text-sm text-stone-500">
            <span className="font-semibold text-stone-700">
              {filteredPaths.length}
            </span>{" "}
            results
            {searchQuery && (
              <>
                {" "}
                for "
                <span className="font-semibold text-stone-700">
                  {searchQuery}
                </span>
                "
              </>
            )}
            {activeType !== "all" && (
              <>
                {" "}
                in{" "}
                <span className="font-semibold text-stone-700">
                  {activeType}
                </span>
              </>
            )}
          </p>
        </section>
      )}

      {/* Loading skeleton */}
      {loading && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      )}

      {/* Path grid */}
      {!loading && filteredPaths.length > 0 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPaths.map((p, idx) => (
              <PathCard key={`${p.id}-${p.category}`} path={p} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && filteredPaths.length === 0 && (
        <section className="py-20 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-stone-700 mb-1">
            No paths found
          </h3>
          <p className="text-sm text-stone-400">
            {searchQuery
              ? "Try a different search term."
              : "Be the first to create one in this category."}
          </p>
          <Button
            asChild
            to="/createpath"
            className="mt-4 rounded-none text-xs font-semibold bg-stone-900 hover:bg-stone-800"
          >
            <Link to="/createpath">Create a path →</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
