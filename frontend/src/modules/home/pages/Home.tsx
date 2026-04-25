import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  listPublicLearningPaths,
  type PublicLearningPath,
} from "@/services/learningPath";
import { PathCard, type PoolPath } from "@/components/PathCard";
import { PopularPathCard } from "@/components/PopularPathCard";

function mapDbToPool(p: PublicLearningPath): PoolPath {
  const lpType = String(p.type || "").trim().toLowerCase();
  let typeLabel = "Path";
  if (lpType.includes("linear")) typeLabel = "Linear";
  else if (lpType.includes("struct")) typeLabel = "Structured";
  else if (lpType.includes("partical") || lpType.includes("pool"))
    typeLabel = "Pool";

  return {
    id: String(p.id),
    title: p.title || `Path ${p.id}`,
    description: p.description || "",
    thumbnail: p.cover_image_url || "",
    level: "Beginner",
    typeLabel,
    category: p.category_name || "General",
    items: Number((p as any).item_count ?? 0),
    hotScore: 50,
  };
}

// ─── Section label ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4">
      {children}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Home() {
  const [featuredPaths, setFeaturedPaths] = useState<PoolPath[]>([]);
  const [poolPaths, setPoolPaths] = useState<PoolPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPaths() {
      setLoading(true);
      try {
        const db = await listPublicLearningPaths();
        const mapped = (db || []).map(mapDbToPool);
        setFeaturedPaths(mapped.slice(0, 3));
        setPoolPaths(mapped.slice(3, 11));
      } catch {
        setFeaturedPaths([]);
        setPoolPaths([]);
      } finally {
        setLoading(false);
      }
    }
    void fetchPaths();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Hero ── */}
      <section className="border-b border-stone-200">
        <div className="grid md:grid-cols-2 min-h-[85vh]">
          {/* Left: Content */}
          <div className="flex flex-col justify-center px-6 lg:px-12 py-20 border-r-0 md:border-r border-stone-200">
            <span className="text-sm font-medium tracking-[0.2em] uppercase mb-6 text-amber-600">
              Learning Platform
            </span>
            <h1 className="font-serif text-display lg:text-hero font-bold leading-[0.92] tracking-tight mb-8">
              Curated
              <br />
              Resources.
              <br />
              <span className="text-amber-500">Structured.</span>
            </h1>
            <p className="text-base text-stone-600 max-w-md mb-10 leading-relaxed">
              Discover GitHub projects, AI tools, tutorials and articles — organized into learning paths you can follow or generate with AI.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/learningpool"
                className="btn-primary"
              >
                Explore Paths
              </Link>
              <Link
                to="/ai-resource"
                className="btn-outline"
              >
                Search Resources
              </Link>
            </div>
          </div>

          {/* Right: Featured visual */}
          <div className="relative bg-stone-900 text-stone-50 flex items-center">
            <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-stone-700" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-stone-700" />
            <div className="p-8 lg:p-12">
              <span className="text-xs font-medium tracking-[0.3em] uppercase text-stone-400">
                Featured Path
              </span>
              <blockquote className="font-serif text-headline lg:text-display font-bold leading-tight mt-6 mb-8">
                "Master AI tools and build real projects step by step."
              </blockquote>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium tracking-wide uppercase text-stone-400">
                  {featuredPaths[0]?.category || "Machine Learning"}
                </span>
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-sm font-medium tracking-wide uppercase text-stone-400">
                  {featuredPaths[0]?.items || 12} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pull Quote ── */}
      <section className="py-24 px-6 lg:px-12 border-b border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="pull-quote text-headline lg:text-display">
            "Transform scattered resources into structured expertise."
          </p>
          <cite className="text-sm font-medium tracking-wide uppercase text-stone-400 not-italic mt-6 block">
            — LearnPathly Philosophy
          </cite>
        </div>
      </section>

      {/* ── Featured Paths ── */}
      <section className="py-20 px-6 lg:px-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <SectionLabel>Trending</SectionLabel>
              <h2 className="font-serif text-headline lg:text-display font-bold tracking-tight">
                Most Popular
                <br />
                Learning Paths
              </h2>
            </div>
            <Link to="/learningpool" className="hidden md:block article-link">
              View all paths
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="shrink-0 w-64">
                  <div className="h-40 bg-stone-100 mb-4" />
                  <div className="h-4 w-20 bg-stone-200 mb-2" />
                  <div className="h-6 w-full bg-stone-200 mb-2" />
                  <div className="h-4 w-32 bg-stone-200" />
                </div>
              ))
            ) : featuredPaths.length > 0 ? (
              featuredPaths.map((path, idx) => (
                <PopularPathCard key={path.id} path={path} index={idx} />
              ))
            ) : (
              <div className="shrink-0 py-20 text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-stone-400">
                  No paths yet.
                </p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link to="/learningpool" className="btn-outline">
              View all paths
            </Link>
          </div>
        </div>
      </section>

      {/* ── How to Use ── */}
      <section className="py-20 px-6 lg:px-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4 block">
              Get Started
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight">
              How to Use LearnPathly
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                1
              </div>
              <h3 className="font-semibold text-lg text-stone-900 mb-3">Browse Learning Paths</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Explore curated paths created by the community. Filter by technology, difficulty, or topic.
              </p>
              <Link to="/learningpool" className="inline-block mt-4 text-sm font-medium text-amber-600 hover:text-blue-700 transition-colors">
                Explore paths →
              </Link>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                2
              </div>
              <h3 className="font-semibold text-lg text-stone-900 mb-3">Generate with AI</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Describe what you want to learn. AI generates a personalized path with the best resources.
              </p>
              <Link to="/ai-path" className="inline-block mt-4 text-sm font-medium text-amber-600 hover:text-blue-700 transition-colors">
                Try AI generator →
              </Link>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                3
              </div>
              <h3 className="font-semibold text-lg text-stone-900 mb-3">Track Your Progress</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Save paths, mark resources as complete, and watch your progress as you build new skills.
              </p>
              <Link to="/register" className="inline-block mt-4 text-sm font-medium text-amber-600 hover:text-blue-700 transition-colors">
                Create account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Path Demo ── */}
      <section className="py-20 px-6 lg:px-12 bg-stone-900 text-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div>
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-400 mb-4 block">
                How it works
              </span>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
                Build your learning path in minutes
              </h2>
              <p className="text-stone-400 leading-relaxed mb-8">
                Describe what you want to learn. Our AI analyzes the best resources across GitHub, tutorials, and courses — then organizes them into a structured path just for you.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-amber-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-50 mb-1">Describe your goal</h4>
                    <p className="text-sm text-stone-400">Tell us what technology or skill you want to learn.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-amber-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-50 mb-1">AI generates your path</h4>
                    <p className="text-sm text-stone-400">Curated resources ranked by quality and relevance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-amber-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-50 mb-1">Track your progress</h4>
                    <p className="text-sm text-stone-400">Mark resources as complete and see your growth.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/ai-path"
                  className="inline-flex items-center gap-2 bg-amber-500 text-stone-900 px-6 py-3 text-sm font-semibold hover:bg-amber-400 transition-colors duration-200"
                >
                  Try AI Path Generator
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right: Demo visualization */}
            <div className="relative">
              <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
                {/* Demo path steps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-stone-700/50 rounded-lg">
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-stone-900 text-xs font-bold">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-200 truncate">Introduction to React</p>
                      <p className="text-xs text-stone-500">Documentation · 30 min</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div className="ml-3 w-0.5 h-4 bg-stone-600" />
                  <div className="flex items-center gap-4 p-3 bg-stone-700/50 rounded-lg border-2 border-blue-500/50">
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-stone-900 text-xs font-bold">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-200 truncate">Build a Todo App</p>
                      <p className="text-xs text-stone-500">Tutorial · 1 hour</p>
                    </div>
                    <div className="w-3 h-3 border-2 border-blue-500 rounded-full" />
                  </div>
                  <div className="ml-3 w-0.5 h-4 bg-stone-600" />
                  <div className="flex items-center gap-4 p-3 bg-stone-700/50 rounded-lg">
                    <div className="w-6 h-6 bg-stone-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-stone-400 text-xs font-bold">3</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-400 truncate">Advanced Patterns</p>
                      <p className="text-xs text-stone-500">Course · 2 hours</p>
                    </div>
                    <div className="w-3 h-3 border-2 border-stone-600 rounded-full" />
                  </div>
                  <div className="ml-3 w-0.5 h-4 bg-stone-600" />
                  <div className="flex items-center gap-4 p-3 bg-stone-700/50 rounded-lg">
                    <div className="w-6 h-6 bg-stone-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-stone-400 text-xs font-bold">4</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-400 truncate">Deploy to Production</p>
                      <p className="text-xs text-stone-500">Guide · 45 min</p>
                    </div>
                    <div className="w-3 h-3 border-2 border-stone-600 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border border-stone-700 rounded-lg" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-amber-500/10 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* ── The Pool ── */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <SectionLabel>Collection</SectionLabel>
              <h2 className="font-serif text-headline lg:text-display font-bold tracking-tight">
                The Pool
              </h2>
            </div>
            <Link to="/learningpool" className="hidden md:block article-link">
              Open pool
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-4/3 bg-stone-100 rounded-lg mb-4" />
                  <div className="h-4 w-20 bg-stone-200 mb-2" />
                  <div className="h-5 w-full bg-stone-200 mb-2" />
                  <div className="h-3 w-24 bg-stone-200" />
                </div>
              ))}
            </div>
          ) : poolPaths.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {poolPaths.map((path, idx) => (
                <PathCard key={path.id} path={path} index={idx} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-stone-400">
                Nothing in the pool yet.
              </p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/learningpool" className="btn-outline">
              Open Pool →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <section className="py-24 px-6 lg:px-12 bg-stone-900 text-stone-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-headline lg:text-display font-bold mb-6 tracking-tight">
            Start Your Learning
            <br />
            <span className="text-amber-400">Journey Today</span>
          </h2>
          <p className="text-stone-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of developers building real skills with curated resources and AI-generated paths.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="bg-amber-500 text-stone-900 px-8 py-4 text-base font-semibold hover:bg-amber-400 transition-colors duration-200 rounded-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/ai-resource"
              className="border border-stone-600 text-stone-50 px-8 py-4 text-base font-medium hover:bg-stone-800 hover:border-stone-500 transition-colors duration-200 rounded-lg"
            >
              Try AI Search
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
