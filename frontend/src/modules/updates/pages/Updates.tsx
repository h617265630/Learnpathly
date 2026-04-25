import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Sparkles, Code, Video, FileText, Globe } from "lucide-react";

const implementedFeatures = [
  {
    title: "AI Resource Discovery",
    description: "AI-powered resource fetching from GitHub projects, YouTube videos, articles, and websites across multiple platforms.",
    icon: Sparkles,
  },
  {
    title: "GitHub Project Integration",
    description: "Fetch and display GitHub project details including stars, forks, issues, and README content.",
    icon: Code,
  },
  {
    title: "Path Item Notes",
    description: "Users can now add personal notes to each path item, with persistent storage and real-time sync.",
    icon: FileText,
  },
];

const upcomingFeatures = [
  {
    title: "Resource Cards & Favorites",
    description: "Card-based resource display with user favorites and collection management.",
    icon: Sparkles,
  },
  {
    title: "Video Card Component",
    description: "Specialized card design for YouTube videos with thumbnail, duration, and channel info.",
    icon: Video,
  },
  {
    title: "Article Card Component",
    description: "Dedicated card layout for articles with reading time, author, and preview content.",
    icon: FileText,
  },
  {
    title: "Website Card Component",
    description: "Card design for general websites with screenshot preview, domain, and meta information.",
    icon: Globe,
  },
  {
    title: "AI Path Generation",
    description: "AI generates complete learning paths with stages, steps, and curated resources based on your goals.",
    icon: Sparkles,
  },
];

export default function Updates() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Product
                </span>
              </div>
              <h1 className="text-3xl font-black leading-[0.92] tracking-tight text-stone-900 md:text-5xl">
                Updates
                <br />
                <span className="text-amber-500">& Roadmap.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 rounded-md border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
              What We&apos;re Building
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-900">
              Discover what&apos;s new and what&apos;s coming next
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              We&apos;re continuously improving Learnpathly with AI-powered features
              and new ways to organize your learning journey. See what we&apos;ve
              recently shipped and what we&apos;re working on.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Implemented Features */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </span>
              <div>
                <h3 className="text-xl font-black tracking-tight text-stone-900">
                  Recently Shipped
                </h3>
                <p className="text-xs text-stone-500">Features you can use today</p>
              </div>
            </div>

            <div className="space-y-3">
              {implementedFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-md border border-stone-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <Icon className="h-4 w-4 text-emerald-600" />
                      </span>
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-stone-900">
                          {feature.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-stone-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Upcoming Features */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <ArrowRight className="h-5 w-5 text-amber-600" />
              </span>
              <div>
                <h3 className="text-xl font-black tracking-tight text-stone-900">
                  Coming Soon
                </h3>
                <p className="text-xs text-stone-500">Features we&apos;re building</p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-md border border-stone-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
                        <Icon className="h-4 w-4 text-amber-600" />
                      </span>
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-stone-900">
                          {feature.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-stone-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <section className="mt-12 rounded-md border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-stone-900">
                Want to try AI Path Generation?
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Generate personalized learning paths based on your goals.
              </p>
            </div>
            <Link to="/ai-path">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-sm bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
              >
                Try AI Path
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}