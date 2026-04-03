import { Link } from 'react-router-dom'

export default function AboutLearningPaths() {
  return (
    <div className="min-h-screen">

      {/* Editorial hero */}
      <section className="relative overflow-hidden bg-stone-50 border-b border-stone-200">
        {/* Decorative large background text */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none" aria-hidden="true">
          <span className="text-[20vw] font-black text-stone-100 leading-none tracking-tighter">LP</span>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-sky-600"></span>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">About</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-stone-900 leading-[0.92] mb-8">
              Learning<br/>
              <span className="text-sky-600">paths</span><br/>
              that work.
            </h1>

            <p className="text-base leading-relaxed text-stone-600 max-w-lg">
              Learning paths turn resources into a sequence: what to learn, in what order, and why. Build a path that matches your goal and keep it iterative.
            </p>
          </div>
        </div>
      </section>

      {/* How it works: asymmetric 2-col */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-12 gap-8 md:gap-12">

          {/* Left: introduction */}
          <div className="col-span-12 md:col-span-5">
            <div className="sticky top-24">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-sky-600 mb-4 block">How it works</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 leading-tight mb-6">
                From collection to completion.
              </h2>
              <p className="text-sm leading-relaxed text-stone-500 mb-6">
                A learning path is more than a list of links. It's a intentional sequence that respects the dependencies between concepts—learning X before Y because that's how understanding actually builds.
              </p>
              <Link to="/createpath" className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors group">
                Create a path
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Right: steps */}
          <div className="col-span-12 md:col-span-7">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-stone-900 text-white flex items-center justify-center text-lg font-semibold">1</div>
                    <div className="w-px h-full bg-stone-200 mt-3"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">Select resources</h3>
                    <p className="text-sm leading-relaxed text-stone-500">Choose items from your library to include in the path. You can add more or remove items later as your understanding evolves.</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-stone-900 text-white flex items-center justify-center text-lg font-semibold">2</div>
                    <div className="w-px h-full bg-stone-200 mt-3"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">Arrange into sequence</h3>
                    <p className="text-sm leading-relaxed text-stone-500">Drag and drop to define the order. Think about what needs to come first, what builds on what, and where transitions make sense.</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-stone-900 text-white flex items-center justify-center text-lg font-semibold">3</div>
                    <div className="w-px h-full bg-stone-200 mt-3"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">Set visibility and categories</h3>
                    <p className="text-sm leading-relaxed text-stone-500">Choose who can see your path. Keep work-in-progress private, share completed paths with the community, or keep certain paths just for yourself.</p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">Track progress as you go</h3>
                    <p className="text-sm leading-relaxed text-stone-500">Mark items complete, see your overall progress, and pick up exactly where you left off. Learning stays continuous.</p>
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
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">Path types</span>
          <span className="h-px flex-1 bg-gradient-to-l from-stone-200 to-transparent"></span>
        </div>
      </div>

      {/* Path types */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Linear */}
          <div className="border border-stone-200 rounded-md p-6 hover:border-stone-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900">Linear</h3>
            </div>
            <p className="text-sm leading-relaxed text-stone-500">Step-by-step progression. Each item leads naturally to the next, like chapters in a book. Best for sequential skills.</p>
          </div>

          {/* Structured */}
          <div className="border border-stone-200 rounded-md p-6 hover:border-stone-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900">Structured</h3>
            </div>
            <p className="text-sm leading-relaxed text-stone-500">Modules with a stronger framework. Group items into sections that can be approached somewhat independently. Best for broader topics.</p>
          </div>

          {/* Pool */}
          <div className="border border-stone-200 rounded-md p-6 hover:border-stone-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900">Pool</h3>
            </div>
            <p className="text-sm leading-relaxed text-stone-500">A curated collection you can explore freely. Items are related but don't require a strict order. Best for reference material.</p>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-7xl px-4 py-12 pb-20">
        <div className="max-w-3xl">
          <blockquote className="text-2xl md:text-3xl font-light leading-snug text-stone-700">
            "A learning path isn't a rigid curriculum; it's a
            <span className="font-semibold text-emerald-700">map</span> that keeps you oriented when the terrain gets steep."
          </blockquote>
        </div>
      </section>

    </div>
  )
}