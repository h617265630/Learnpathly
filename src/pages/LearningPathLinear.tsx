import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import {
  getPublicLearningPathDetail,
  getMyLearningPathDetail,
  type PublicLearningPathDetail,
} from '@/api/learningPath'
import { getResourceDetail, getMyResourceDetail, type DbResourceDetail } from '@/api/resource'
import { Button } from '@/components/ui/Button'

// ─── Types ──────────────────────────────────────────────────────────────────

type ModuleType = 'video' | 'document' | 'article' | 'clip' | 'link' | 'unknown'

type Module = {
  id: string
  resourceId: string
  title: string
  summary: string
  type: ModuleType
  orderIndex: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop'

function inferModuleType(item: unknown, r: unknown): ModuleType {
  const presented = String((r as any)?.resource_type || '').trim().toLowerCase()
  const raw = String((item as any)?.resource_type || '').trim().toLowerCase()
  const candidate = presented || raw

  if (candidate === 'video') return 'video'
  if (candidate === 'document') return 'document'
  if (candidate === 'article') return 'article'
  if (candidate === 'clip') return 'clip'

  if (candidate === 'link') {
    const url = String((r as any)?.source_url || '').trim().toLowerCase()
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video'
    const base = url.split('?', 1)[0]
    if (base.endsWith('.pdf')) return 'document'
    return 'article'
  }

  return 'unknown'
}

function typeLabel(type: ModuleType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

async function fetchResourceDetail(resourceId: number): Promise<DbResourceDetail | null> {
  try {
    return await getResourceDetail(resourceId)
  } catch {
    try {
      return await getMyResourceDetail(resourceId)
    } catch {
      return null
    }
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LearningPathLinear() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const fromMyPaths = searchParams.get('from') === 'my-paths'

  const { isAuthed } = useAuth()
  const navigate = useNavigate()

  const [path, setPath] = useState<PublicLearningPathDetail | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  const [resourceCache] = useState<Record<string, DbResourceDetail>>({})

  const loadDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const nid = Number(id)
      if (!Number.isFinite(nid)) throw new Error('Invalid path id')

      const isMy = fromMyPaths
      const detail = isMy
        ? await getMyLearningPathDetail(nid)
        : await getPublicLearningPathDetail(nid)

      setPath(detail)

      const items = Array.isArray(detail.path_items) ? detail.path_items : []

      // Hydrate missing resource_data
      const missing = items
        .filter((it: any) => !it?.resource_data)
        .map((it: any) => Number(it?.resource_id))
        .filter((n: number) => Number.isFinite(n) && n > 0)

      const uniq = Array.from(new Set(missing))
      await Promise.allSettled(
        uniq.map(async (rid) => {
          const key = String(rid)
          if (resourceCache[key]) return
          const r = await fetchResourceDetail(rid)
          if (r) (resourceCache as any)[key] = r
        }),
      )

      const sorted = [...items].sort((a, b) => {
        const ai = Number((a as any)?.order_index) || 0
        const bi = Number((b as any)?.order_index) || 0
        return ai - bi
      })

      const mapped: Module[] = sorted.map((it: any) => {
        const r = (it?.resource_data || null) as any
        const uiType: ModuleType = inferModuleType(it, r)
        return {
          id: String(it.id),
          resourceId: String(it.resource_id),
          title: String(it.title || r?.title || `Resource ${it.resource_id}`),
          summary: String(r?.summary || ''),
          type: uiType,
          orderIndex: Number(it.order_index) || 0,
        }
      })

      setModules(mapped)
      setCurrentIndex(0)
    } catch (e: any) {
      setError(String(e?.response?.data?.detail || e?.message || 'Failed to load path'))
    } finally {
      setLoading(false)
    }
  }, [id, fromMyPaths, resourceCache])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  function moduleThumb(m: Module): string {
    const r = resourceCache[m.resourceId]
    const url = String(r?.thumbnail || '').trim()
    return url || FALLBACK_THUMB
  }

  function goToResource(m: Module) {
    if (!m.resourceId) return
    const query: Record<string, string> = {}
    if (m.id) query.path_item_id = String(m.id)
    const search = new URLSearchParams(query).toString()
    const searchStr = search ? `?${search}` : ''

    if (m.type === 'video' || m.type === 'clip') {
      navigate(`/resources/video/${m.resourceId}${searchStr}`)
      return
    }
    if (m.type === 'document') {
      navigate(`/resources/document/${m.resourceId}${searchStr}`)
      return
    }
    navigate(`/resources/article/${m.resourceId}${searchStr}`)
  }

  const current = modules[currentIndex]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Linear View
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-stone-900 leading-[0.92]">
                {path?.title || 'Learning Path'}
              </h1>
              {path?.description && (
                <p className="mt-2 max-w-xl text-sm text-stone-500">{path.description}</p>
              )}
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
            >
              <Link to={fromMyPaths ? '/my-paths' : '/learningpool'}>
                ← {fromMyPaths ? 'My Paths' : 'LearningPool'}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm text-stone-400">Loading…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-12 rounded-md border border-red-100 bg-red-50/50 p-6 text-center">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && modules.length > 0 && current && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>
                Step {currentIndex + 1} of {modules.length}
              </span>
              <span className="capitalize">{typeLabel(current.type)}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / modules.length) * 100}%` }}
              />
            </div>

            {/* Current resource card */}
            <div
              className="rounded-md bg-white border border-stone-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => goToResource(current)}
            >
              <div className="relative bg-stone-100 overflow-hidden" style={{ aspectRatio: '16/9', width: '100%' }}>
                <img
                  src={moduleThumb(current)}
                  alt={current.title}
                  className="block w-full h-full object-contain"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f7f7f7' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    {typeLabel(current.type)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-lg font-bold text-stone-900 leading-snug">
                  {current.title}
                </h2>
                {current.summary && (
                  <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                    {current.summary}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-stone-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Click to open</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex gap-1">
                {modules.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-amber-500' : idx < currentIndex ? 'bg-stone-400' : 'bg-stone-200'
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
                onClick={() => setCurrentIndex(i => Math.min(modules.length - 1, i + 1))}
                disabled={currentIndex === modules.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && modules.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-stone-500">This learning path has no items yet.</p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-4 border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
            >
              <Link to={fromMyPaths ? '/my-paths' : '/learningpool'}>
                ← Back
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}