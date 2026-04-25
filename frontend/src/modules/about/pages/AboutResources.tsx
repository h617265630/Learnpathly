import { Link } from "react-router-dom";

export default function AboutResources() {
  return (
    <div className="min-h-screen">
      {/* Editorial hero */}
      <section className="relative overflow-hidden bg-stone-50 border-b border-stone-200">
        {/* Decorative large background text */}
        <div
          className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none"
          aria-hidden="true"
        >
          <span className="text-[20vw] font-black text-stone-100 leading-none tracking-tighter">
            RE
          </span>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-emerald-600"></span>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">
                About
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-stone-900 leading-[0.92] mb-8">
              Your
              <br />
              <span className="text-emerald-600">library</span>
              <br />
              of learning.
            </h1>

            <p className="text-base leading-relaxed text-stone-600 max-w-lg">
              Resources are the raw inputs of learning: videos, articles,
              documents, and links. Learnpathly helps you collect them into a
              single library and keeps them organized with metadata.
            </p>
          </div>
        </div>
      </section>

      {/* What you can store: asymmetric 2-col */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          {/* Left: introduction */}
          <div className="col-span-12 md:col-span-5">
            <div className="sticky top-24">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600 mb-4 block">
                What you can store
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 leading-tight mb-6">
                Four types, one library.
              </h2>
              <p className="text-sm leading-relaxed text-stone-500 mb-6">
                Instead of scattered bookmarks and browser tabs, keep everything
                in one place. Each resource type has its own viewing experience
                optimized for how you actually consume that content.
              </p>
              <Link
                to="/my-resources"
                className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors group"
              >
                View my resources
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Right: resource type cards */}
          <div className="col-span-12 md:col-span-7">
            <div className="space-y-6">
              {/* Video */}
              <div className="relative border-l-2 border-stone-200 pl-8 group hover:border-l-emerald-500 transition-colors">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-stone-400">
                    1
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone-400"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <h3 className="text-xl font-semibold text-stone-900">
                      Video
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-500">
                    YouTube and Bilibili videos. The player keeps track of your
                    position so you can pause and resume without losing your
                    place.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600">
                      YouTube
                    </span>
                    <span className="inline-flex items-center rounded bg-pink-50 px-2 py-1 text-[11px] font-medium text-pink-600">
                      Bilibili
                    </span>
                  </div>
                </div>
              </div>

              {/* Article */}
              <div className="relative border-l-2 border-stone-200 pl-8 group hover:border-l-sky-600 transition-colors">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-stone-400">
                    2
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone-400"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <h3 className="text-xl font-semibold text-stone-900">
                      Article
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-500">
                    Blog posts, newsletters, documentation. Articles are
                    formatted for comfortable reading with a clean
                    typography-first layout.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600">
                      Blog
                    </span>
                    <span className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600">
                      Newsletter
                    </span>
                    <span className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600">
                      Docs
                    </span>
                  </div>
                </div>
              </div>

              {/* Document */}
              <div className="relative border-l-2 border-stone-200 pl-8 group hover:border-l-amber-600 transition-colors">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-stone-400">
                    3
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone-400"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <h3 className="text-xl font-semibold text-stone-900">
                      Document
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-500">
                    PDFs and downloadable files. Documents are stored with their
                    source URL so you can always find the original.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-600">
                      PDF
                    </span>
                    <span className="inline-flex items-center rounded bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-600">
                      EPUB
                    </span>
                  </div>
                </div>
              </div>

              {/* Link */}
              <div className="relative border-l-2 border-stone-200 pl-8 group hover:border-l-stone-400 transition-colors">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-stone-400">
                    4
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone-400"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <h3 className="text-xl font-semibold text-stone-900">
                      Link
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-500">
                    Quick saves for links you want to revisit. Convert to a full
                    resource type later when you have more context.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-500">
                      Quick Save
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider with label */}
      <div className="border-t border-stone-200 mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-6 py-6">
          <span className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent"></span>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">
            Why it matters
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-stone-200 to-transparent"></span>
        </div>
      </div>

      {/* Why it matters */}
      <section className="mx-auto max-w-7xl px-4 py-12 pb-20">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-stone-600"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 mb-1">
                  Less tab chaos
                </h4>
                <p className="text-sm text-stone-500">
                  One place for everything instead of scattered browser tabs
                  you'll never find again.
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-stone-600"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 mb-1">
                  Cleaner context
                </h4>
                <p className="text-sm text-stone-500">
                  When you return to learn, everything is organized and ready.
                  No reliving the chaos.
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-stone-600"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 mb-1">
                  Better building blocks
                </h4>
                <p className="text-sm text-stone-500">
                  Organized resources are the foundation for building meaningful
                  learning paths.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
