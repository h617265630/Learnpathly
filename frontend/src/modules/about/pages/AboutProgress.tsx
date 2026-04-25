import { Link } from "react-router-dom";

export default function AboutProgress() {
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
            PR
          </span>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-amber-600"></span>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">
                About
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-stone-900 leading-[0.92] mb-8">
              Progress
              <br />
              <span className="text-amber-600">that</span>
              <br />
              stays.
            </h1>

            <p className="text-base leading-relaxed text-stone-600 max-w-lg">
              Progress helps you keep continuity. Learnpathly stores progress
              per path item so you can resume learning without losing context—no
              more "where was I?" moments.
            </p>
          </div>
        </div>
      </section>

      {/* How tracking works: asymmetric 2-col */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          {/* Left: introduction */}
          <div className="col-span-12 md:col-span-5">
            <div className="sticky top-24">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-600 mb-4 block">
                Tracked per step
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 leading-tight mb-6">
                Always know where you left off.
              </h2>
              <p className="text-sm leading-relaxed text-stone-500 mb-6">
                Every resource in a path can track its own completion state.
                Videos remember your position. Articles mark when done. Resume
                exactly where you stopped—or start fresh if you prefer.
              </p>
              <Link
                to="/my-paths"
                className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors group"
              >
                View my paths
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Right: tracking details */}
          <div className="col-span-12 md:col-span-7">
            <div className="space-y-8">
              {/* Video tracking */}
              <div className="relative border-l-2 border-stone-200 pl-8 group hover:border-l-amber-500 transition-colors">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
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
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-stone-900">
                      Video position tracking
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-500 mb-3">
                    When video player APIs are available, Learnpathly can
                    remember your playback position. Close the tab, come back
                    later, and the video resumes where you left off.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300"></span>
                    <span>When supported by the video platform</span>
                  </div>
                </div>
              </div>

              {/* Document/Article tracking */}
              <div className="relative border-l-2 border-stone-200 pl-8 group hover:border-l-amber-500 transition-colors">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
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
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-stone-900">
                      Document and article completion
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-500 mb-3">
                    Mark documents and articles as complete with one click. The
                    action is instant—no scroll-to-bottom tracking, just a
                    simple toggle when you're done.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300"></span>
                    <span>Manual one-click completion</span>
                  </div>
                </div>
              </div>

              {/* Path-level progress */}
              <div className="relative border-l-2 border-stone-200 pl-8 group hover:border-l-amber-500 transition-colors">
                <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-stone-400"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-stone-900">
                      Path-level overview
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-stone-500 mb-3">
                    See completion at both the step level and the path level. A
                    progress bar shows how far you've come and how much is left.
                    Motivation that compound over time.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300"></span>
                    <span>Aggregated from all step progress</span>
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
            Why it works
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-stone-200 to-transparent"></span>
        </div>
      </div>

      {/* Why it works */}
      <section className="mx-auto max-w-7xl px-4 py-12 pb-20">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-600"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 mb-1">
                  Resuming is instant
                </h4>
                <p className="text-sm text-stone-500">
                  No more "where was I?" Just open your path and pick up right
                  where you left off. The friction of restarting is gone.
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-800 mb-1">
                  Completion is visible
                </h4>
                <p className="text-sm text-stone-500">
                  Seeing progress—actual, tangible progress—is motivating. Watch
                  the completion percentage climb as you work through your path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
