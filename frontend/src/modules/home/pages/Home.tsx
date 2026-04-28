import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import {
  listPublicLearningPaths,
  type PublicLearningPath,
} from "@/services/learningPath";
import { listAiPathProjects } from "@/services/aiPath";
import { PathCard, type PoolPath } from "@/components/PathCard";
import { PopularPathCard } from "@/components/PopularPathCard";
import { LearnPathCard, type LearnPathProject } from "@/components/LearnPathCard";

const WELCOME_MODAL_KEY = "learnpathly_welcome_modal_dismissed_v1";

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

  const [aiProjects, setAiProjects] = useState<LearnPathProject[]>([]);
  const [loadingAiProjects, setLoadingAiProjects] = useState(false);

  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the modal before
    const dismissed = localStorage.getItem(WELCOME_MODAL_KEY);
    if (!dismissed) {
      setShowWelcomeModal(true);
    }
  }, []);

  function dismissWelcomeModal() {
    setShowWelcomeModal(false);
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
  }

  useEffect(() => {
    async function fetchPaths() {
      setLoading(true);
      try {
        const db = await listPublicLearningPaths();
        const mapped = (db || []).map(mapDbToPool);
        setFeaturedPaths(mapped.slice(0, 4));
        setPoolPaths(mapped.slice(4, 12));
      } catch {
        setFeaturedPaths([]);
        setPoolPaths([]);
      } finally {
        setLoading(false);
      }
    }
    void fetchPaths();
  }, []);

  useEffect(() => {
    setLoadingAiProjects(true);
    listAiPathProjects(8, 0)
      .then((res) => {
        const next = (res || []).map((p) => ({
          id: Number((p as any).id),
          topic: String((p as any).topic || "").trim(),
          outline_overview: String((p as any).outline_overview || "").trim(),
          created_at: (p as any).created_at,
          total_subnodes: Number((p as any).total_subnodes || 0),
          completed_subnodes: Number((p as any).completed_subnodes || 0),
          is_complete: Boolean((p as any).is_complete),
        }));
        setAiProjects(next.filter((p) => Number.isFinite(p.id) && p.id > 0 && p.topic));
      })
      .catch(() => setAiProjects([]))
      .finally(() => setLoadingAiProjects(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-md border border-stone-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">
                  Welcome
                </span>
                <h2 className="mt-1 text-lg font-bold text-stone-900">
                  Getting Started with LearnPathly
                </h2>
              </div>
              <button
                onClick={dismissWelcomeModal}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-4">
              <p className="text-sm text-stone-600 leading-relaxed">
                LearnPathly offers two types of learning paths:
              </p>

              {/* Resource Path */}
              <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
                <h3 className="text-sm font-bold text-stone-900 mb-2">
                  📚 Resource Path
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Curated collections of resources organized into structured paths. Each resource includes detailed descriptions and summaries to help you understand what you'll learn.
                </p>
              </div>

              {/* AI Learn Path */}
              <div className="rounded-md border border-sky-200 bg-sky-50 p-4">
                <h3 className="text-sm font-bold text-stone-900 mb-2">
                  🤖 AI Learn Path
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  AI-generated learning paths based on your input topic. The AI creates an outline with knowledge nodes. When you want to dive deeper into a specific node, click to generate detailed explanations and resources.
                </p>
              </div>

              {/* Recommendation */}
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-bold text-stone-900 mb-2">
                  💡 Recommended
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Visit the <Link to="/learningpool" className="text-sky-600 font-semibold hover:underline">Pool page</Link> to explore both path types:
                </p>
                <ul className="mt-2 text-sm text-stone-600 space-y-1">
                  <li>• <strong>Resource Path:</strong> Check "Useful UI Skill Collection" for a complete example</li>
                  <li>• <strong>AI Learn Path:</strong> Look for paths marked as "Completed" for fully generated content</li>
                </ul>
              </div>

              {/* Notice */}
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-bold text-stone-900 mb-2">
                  ⚠️ Notice
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  The AI features in the navigation bar (AI Path Generator, AI Resource Search) are currently experiencing performance issues. Content generation may take longer than expected. We recommend exploring existing paths in the Pool page for now.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
              <button
                onClick={dismissWelcomeModal}
                className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
              >
                Don't show again
              </button>
              <Link
                to="/learningpool"
                onClick={dismissWelcomeModal}
                className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-sky-600 transition-colors"
              >
                Explore Paths
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="border-b border-stone-200">
        <div className="grid md:grid-cols-2 min-h-[85vh]">
          {/* Left: Content */}
          <div className="flex flex-col justify-center px-6 lg:px-12 py-20 border-r-0 md:border-r border-stone-200">
            <span className="text-sm font-medium tracking-[0.2em] uppercase mb-6 text-sky-600">
              Learning Platform
            </span>
            <h1 className="font-serif text-display lg:text-hero font-bold leading-[0.92] tracking-tight mb-8">
              Curated
              <br />
              Resources.
              <br />
              <span className="text-sky-500">Structured.</span>
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

          {/* Right: Featured visual with video background */}
          <div className="relative text-stone-50 flex items-center overflow-hidden">
            {/* Video background */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://assets.mixkit.co/videos/4133/4133-720.mp4"
                type="video/mp4"
              />
            </video>
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-stone-900/60" />
            <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-stone-700/50" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-stone-700/50" />
            <div className="relative z-10 p-8 lg:p-12">
              <span className="text-xs font-medium tracking-[0.3em] uppercase text-stone-400">
                Featured Path
              </span>
              <blockquote className="font-serif text-headline lg:text-display font-bold leading-tight mt-6 mb-8">
                "Explore trending topics with AI-generated outlines, knowledge points, and reference resources."
              </blockquote>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium tracking-wide uppercase text-stone-400">
                  {featuredPaths[0]?.category || "Machine Learning"}
                </span>
                <span className="w-2 h-2 bg-sky-500 rounded-full" />
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
              <SectionLabel>Resource Path</SectionLabel>
              <h2 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
                Resource Path
              </h2>
            </div>
            <Link to="/learningpool" className="hidden md:block article-link">
              View all resource paths
            </Link>
          </div>

	          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
	            {loading ? (
	              [...Array(4)].map((_, i) => (
	                <div key={i}>
	                  <div className="aspect-video bg-stone-100 rounded-lg mb-3" />
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
              <div className="col-span-4 py-20 text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-stone-400">
                  No paths yet.
                </p>
              </div>
	            )}
	          </div>

	          {(loadingAiProjects || aiProjects.length > 0) && (
	            <div className="mt-14">
	              <div className="flex items-end justify-between mb-8">
	                <div>
	                  <SectionLabel>AI</SectionLabel>
	                  <h3 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
	                    AI LearnPaths
	                  </h3>
	                </div>
	                <Link to="/learningpool" className="hidden md:block article-link">
	                  View all
	                </Link>
	              </div>

	              {loadingAiProjects ? (
	                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
	                  {[...Array(8)].map((_, i) => (
	                    <div key={`ai-home-${i}`}>
	                      <div className="aspect-video bg-stone-100 rounded-lg mb-3" />
	                      <div className="h-4 w-28 bg-stone-200 mb-2" />
	                      <div className="h-6 w-full bg-stone-200 mb-2" />
	                      <div className="h-4 w-40 bg-stone-200" />
	                    </div>
	                  ))}
	                </div>
	              ) : (
	                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
	                  {aiProjects.slice(0, 8).map((p) => (
	                    <LearnPathCard key={p.id} project={p} />
	                  ))}
	                </div>
	              )}
	            </div>
	          )}

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
              <div className="w-14 h-14 bg-sky-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                1
              </div>
              <h3 className="font-semibold text-lg text-stone-900 mb-3">Browse Learning Paths</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Explore curated paths created by the community. Filter by technology, difficulty, or topic.
              </p>
              <Link to="/learningpool" className="inline-block mt-4 text-sm font-medium text-sky-600 hover:text-blue-700 transition-colors">
                Explore paths →
              </Link>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-sky-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                2
              </div>
              <h3 className="font-semibold text-lg text-stone-900 mb-3">Generate with AI</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Describe what you want to learn. AI generates a personalized path with the best resources.
              </p>
              <Link to="/learningpool" className="inline-block mt-4 text-sm font-medium text-sky-600 hover:text-blue-700 transition-colors">
                Try AI generator →
              </Link>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-sky-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                3
              </div>
              <h3 className="font-semibold text-lg text-stone-900 mb-3">Track Your Progress</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Save paths, mark resources as complete, and watch your progress as you build new skills.
              </p>
              <Link to="/register" className="inline-block mt-4 text-sm font-medium text-sky-600 hover:text-blue-700 transition-colors">
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
                Learn topics you love with structured paths
              </h2>
              <p className="text-stone-400 leading-relaxed mb-8">
                Describe what you want to learn. Our AI analyzes the best resources across GitHub, tutorials, and courses — then organizes them into a structured path just for you.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-sky-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-50 mb-1">Describe your goal</h4>
                    <p className="text-sm text-stone-400">Tell us what technology or skill you want to learn.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-sky-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-50 mb-1">AI generates your path</h4>
                    <p className="text-sm text-stone-400">Curated resources ranked by quality and relevance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <span className="text-sky-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-50 mb-1">Track your progress</h4>
                    <p className="text-sm text-stone-400">Mark resources as complete and see your growth.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  to="/learningpool"
                  className="inline-flex items-center gap-2 bg-sky-500 text-stone-900 px-6 py-3 text-sm font-semibold hover:bg-sky-400 transition-colors duration-200"
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
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-sky-500/10 rounded-lg" />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-video bg-stone-100 rounded-lg mb-3" />
                  <div className="h-4 w-20 bg-stone-200 mb-2" />
                  <div className="h-5 w-full bg-stone-200 mb-2" />
                  <div className="h-3 w-24 bg-stone-200" />
                </div>
              ))}
            </div>
          ) : poolPaths.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              className="bg-sky-500 text-stone-900 px-8 py-4 text-base font-semibold hover:bg-sky-400 transition-colors duration-200 rounded-lg"
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
