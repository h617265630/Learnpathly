import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateAiPath, type AiPathGenerateResponse } from '@/api/aiPath'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'learnsmart_ai_path_result_v1'

const presets = [
  'I want to learn React full-stack development systematically and launch a production-ready project within 3 months',
  'I want to learn AI Agent development from scratch and build an app that can call tools',
  'I want to learn data analysis with focus on Python, Pandas, visualization, and real-world projects',
]

const steps = [
  { title: 'Enter Goal', text: 'Tell AI your learning direction, current level, time commitment, and desired outcome.' },
  { title: 'Generate Path', text: 'AI calls LangChain to return a structured JSON learning path.' },
  { title: 'View Details', text: 'Check stage descriptions, step breakdowns, and recommended resources.' },
]

function readLastResult(): AiPathGenerateResponse | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as AiPathGenerateResponse : null
  } catch {
    return null
  }
}

export default function AIPath() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<AiPathGenerateResponse | null>(null)

  useEffect(() => {
    setLastResult(readLastResult())
  }, [])

  const handleSubmit = useCallback(async () => {
    const value = query.trim()
    if (!value) return
    setLoading(true)
    setError('')
    try {
      const result = await generateAiPath(value)
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result))
      navigate('/ai-path-detail')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      setError(String(err.response?.data?.detail || err.message || 'AI Path generation failed'))
    } finally {
      setLoading(false)
    }
  }, [query, navigate])

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">AI Guided</span>
              </div>
              <h1 className="text-3xl font-black leading-[0.92] tracking-tight text-stone-900 md:text-5xl">
                AI Path<br /><span className="text-amber-500">Generator.</span>
              </h1>
            </div>
            <p className="hidden max-w-sm text-sm leading-relaxed text-stone-500 md:block">
              Enter your learning goal and let AI generate a structured learning path. View stage descriptions, steps, and recommended resources directly.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3 rounded-md border border-stone-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Prompt</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-900">Describe what you want to learn</h2>
              </div>
              <Link
                to="/ai-path-detail"
                className="text-xs font-semibold uppercase tracking-wider text-stone-400 transition-colors hover:text-amber-500"
              >
                View recent results
              </Link>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={10}
              placeholder="Example: I want to learn React full-stack development systematically, launch a production-ready project in 3 months, including basics, state management, routing, Node.js, database, and deployment."
              className="w-full rounded-sm border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-50"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuery(preset)}
                  className="rounded-sm border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-500 transition-colors hover:border-amber-200 hover:text-amber-700"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-stone-400">
                Tip: Include your goal direction, time frame, current level, and desired outcome.
              </p>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !query.trim()}
                className="rounded-sm bg-amber-500 px-8 text-white hover:bg-amber-600"
              >
                {loading ? 'Generating...' : 'Generate →'}
              </Button>
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          </section>

          <aside className="lg:col-span-2 space-y-5">
            <section className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">How it works</p>
              <div className="mt-4 space-y-4">
                {steps.map((step, idx) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-black text-amber-600">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-900">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-500">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {lastResult && (
              <section className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Latest</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-stone-900">
                      {lastResult.data.title || 'Latest AI Path'}
                    </h3>
                  </div>
                  <Link
                    to="/ai-path-detail"
                    className="text-xs font-semibold uppercase tracking-wider text-amber-500"
                  >
                    Open
                  </Link>
                </div>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-stone-500">{lastResult.data.summary}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-stone-400">
                  <span>{lastResult.data.nodes?.length || 0} stages</span>
                  {lastResult.warnings?.length > 0 && (
                    <span>{lastResult.warnings.length} warnings</span>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}