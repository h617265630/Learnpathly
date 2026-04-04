import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="min-h-screen">

      {/* Editorial hero */}
      <section className="relative overflow-hidden bg-stone-50 border-b border-stone-200">
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-emerald-600"></span>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">About</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-stone-900 leading-[0.92] mb-8">
              Learn<br/>
              <span className="text-emerald-600">with</span><br/>
              intention.
            </h1>

            <p className="text-base leading-relaxed text-stone-600 max-w-lg">
              Learnpathly is a personal learning platform. We help you turn scattered resources—videos, articles, links—into clear, actionable paths you can actually finish.
            </p>
          </div>
        </div>
      </section>

      {/* What we solve + core features: asymmetric 2-col */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-12 gap-8 md:gap-12">

          {/* Left: problem statement */}
          <div className="col-span-12 md:col-span-5">
            <div className="sticky top-24">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-600 mb-4 block">The problem</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 leading-tight mb-6">
                You collect more than you complete.
              </h2>
              <p className="text-sm leading-relaxed text-stone-500 mb-6">
                Browser bookmarks pile up. YouTube watch-later becomes watch-never. Articles are saved and forgotten. Learning happens in fragments—and without a clear structure, progress is invisible and motivation fades.
              </p>
              <p className="text-sm leading-relaxed text-stone-500">
                Learnpathly gives you a framework: turn any topic into a path, add resources in order, and track your progress as you go. Not just a library—a system for finishing what you start.
              </p>
            </div>
          </div>

          {/* Right: three feature columns */}
          <div className="col-span-12 md:col-span-7">
            <div className="grid grid-cols-12 gap-6">
              {/* Resources */}
              <div className="col-span-12 sm:col-span-4 group relative">
                <div className="relative pt-0">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2">Resources</h3>
                  <p className="text-sm leading-relaxed text-stone-500">Import videos, articles, documents, and links. Keep them in one organized library instead of scattered browser tabs.</p>
                  <Link to="/about/resources" className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
                    How it works
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>

              {/* Learning Paths */}
              <div className="col-span-12 sm:col-span-4 group relative">
                <div className="relative pt-0">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2">Learning Paths</h3>
                  <p className="text-sm leading-relaxed text-stone-500">Drag resources into a path, reorder steps, and shape a learning rhythm that fits your goal and schedule.</p>
                  <Link to="/about/learning-paths" className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold uppercase tracking-widest text-sky-600 hover:text-sky-700 transition-colors">
                    How it works
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>

              {/* Progress */}
              <div className="col-span-12 sm:col-span-4 group relative">
                <div className="relative pt-0">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2">Progress</h3>
                  <p className="text-sm leading-relaxed text-stone-500">Track progress per resource and see completion at a glance. Learning stays continuous, not fragmented.</p>
                  <Link to="/about/progress" className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors">
                    How it works
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Additional feature list */}
            <div className="mt-12 border-t border-stone-200 pt-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800">Personal Pool</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Save quick ideas and turn them into resources later.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800">Public & Private</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Choose what you share and what stays personal.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800">Discover</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Browse public paths and resources from other learners.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800">Track</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Record progress per step and see overall completion.</p>
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
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">Philosophy</span>
          <span className="h-px flex-1 bg-gradient-to-l from-stone-200 to-transparent"></span>
        </div>
      </div>

      {/* Philosophy statement */}
      <section className="mx-auto max-w-7xl px-4 py-12 pb-20">
        <div className="max-w-3xl">
          <blockquote className="text-2xl md:text-3xl font-light leading-snug text-stone-700">
            "Structure doesn't constrain creativity—it
            <span className="font-semibold text-emerald-700"> amplifies</span> it. A learning path isn't a rigid curriculum; it's a
            <span className="font-semibold text-sky-700"> map</span> that keeps you oriented when the terrain gets steep."
          </blockquote>
          <p className="mt-6 text-sm text-stone-400">— Learnpathly, Design Principles</p>
        </div>
      </section>

    </div>
  )
}