import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateAiPath, type AiPathGenerateResponse } from '@/api/aiPath'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'learnsmart_ai_path_result_v1'

const presets = [
  '我想系统学习 React 全栈开发，并在 3 个月内做出一个可上线项目',
  '我想从零开始学习 AI Agent 开发，希望最终做出能调用工具的应用',
  '我想学习数据分析，重点掌握 Python、Pandas、可视化和项目实战',
]

const steps = [
  { title: '输入目标', text: '告诉 AI 你的学习方向、当前基础、时间投入和最终成果。' },
  { title: '生成路径', text: '调用 AIpath LangChain 项目接口，返回结构化 JSON 学习路径。' },
  { title: '查看详情', text: '进入详情页查看阶段说明、步骤拆解和资源卡片。' },
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
              输入你的学习目标，让 AI 生成结构化学习路径，并在详情页里直接查看阶段说明、步骤和推荐资源。
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
                <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-900">描述你想学什么</h2>
              </div>
              <Link
                to="/ai-path-detail"
                className="text-xs font-semibold uppercase tracking-wider text-stone-400 transition-colors hover:text-amber-500"
              >
                查看最近结果
              </Link>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={10}
              placeholder="例如：我想系统学习 React 全栈开发，3 个月内做出一个可上线项目，希望路径里包含基础、状态管理、路由、Node.js、数据库和部署。"
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
                建议写清楚目标方向、时间范围、当前基础、最终成果。
              </p>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !query.trim()}
                className="rounded-sm bg-amber-500 px-8 text-white hover:bg-amber-600"
              >
                {loading ? 'Generating...' : 'Generate AI Path →'}
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
                      {lastResult.data.title || '最近一次 AI Path'}
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