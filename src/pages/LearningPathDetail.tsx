import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, Clock, Layers } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import {
  getPublicLearningPathDetail,
  getMyLearningPathDetail,
  attachPublicLearningPathToMe,
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
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
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
    const base = url.split('?', 1)[0]
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video'
    if (base.endsWith('.pdf')) return 'document'
    return 'article'
  }

  return 'unknown'
}

function typeBadgeClass(type: ModuleType): string {
  switch (type) {
    case 'video':
      return 'bg-purple-50 text-purple-700'
    case 'clip':
      return 'bg-purple-50 text-purple-700'
    case 'document':
      return 'bg-blue-50 text-blue-700'
    case 'article':
      return 'bg-green-50 text-green-700'
    case 'link':
      return 'bg-stone-100 text-stone-700'
    default:
      return 'bg-stone-100 text-stone-700'
  }
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

// ─── Component ─────────────────────────────────────────────────────────────

export default function LearningPathDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const fromMyPaths = searchParams.get('from') === 'my-paths'

  const { isAuthed } = useAuth()
  const navigate = useNavigate()

  const [path, setPath] = useState<PublicLearningPathDetail | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [resourceCache] = useState<Record<string, DbResourceDetail>>({})

  const [usingThisPath, setUsingThisPath] = useState(false)
  const [showUseModal, setShowUseModal] = useState(false)
  const [useModalState, setUseModalState] = useState<'confirm' | 'done' | 'error'>('confirm')
  const [useModalTitle, setUseModalTitle] = useState('Use this path')
  const [useModalMessage, setUseModalMessage] = useState('将该路径保存到你的 My Paths？')
  const [useModalHint, setUseModalHint] = useState('')

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

      const mapped: Module[] = items.map((it: any) => {
        const r = (it?.resource_data || null) as any
        const uiType: ModuleType = inferModuleType(it, r)
        return {
          id: String(it.id),
          resourceId: String(it.resource_id),
          title: String(it.title || r?.title || `Resource ${it.resource_id}`),
          summary: String(r?.summary || ''),
          type: uiType,
          duration: '',
          level: 'Beginner' as const,
          orderIndex: Number(it.order_index) || 0,
        }
      })

      setModules(mapped)
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

  function openResource(m: Module) {
    if (!m.resourceId) return
    const query: Record<string, string> = {}
    if (m.id) query.path_item_id = String(m.id)

    if (m.type === 'video' || m.type === 'clip') {
      navigate({ pathname: `/resources/video/${m.resourceId}`, search: new URLSearchParams(query).toString() ? `?${new URLSearchParams(query).toString()}` : undefined })
      return
    }
    if (m.type === 'document') {
      navigate({ pathname: `/resources/document/${m.resourceId}`, search: new URLSearchParams(query).toString() ? `?${new URLSearchParams(query).toString()}` : undefined })
      return
    }
    navigate({ pathname: `/resources/article/${m.resourceId}`, search: new URLSearchParams(query).toString() ? `?${new URLSearchParams(query).toString()}` : undefined })
  }

  function startLearning() {
    if (!id) return
    navigate({ pathname: `/learningpath/${id}/linear`, search: fromMyPaths ? '?from=my-paths' : '' })
  }

  async function startLearningFromPublic() {
    if (usingThisPath || !id) return
    if (!/^[0-9]+$/.test(id)) return

    setUsingThisPath(true)
    try {
      const nid = Number(id)
      const res = await attachPublicLearningPathToMe(nid)
      const nextId = res?.learning_path?.id
      const finalId = typeof nextId === 'number' ? String(nextId) : id
      navigate({ pathname: `/learningpath/${finalId}/linear`, search: '' })
    } catch (e: any) {
      setShowUseModal(true)
      setUseModalState('error')
      setUseModalTitle('保存失败')
      setUseModalMessage(String(e?.response?.data?.detail || e?.message || '保存失败'))
      setUseModalHint('')
    } finally {
      setUsingThisPath(false)
    }
  }

  function openUseThisPath() {
    if (fromMyPaths) {
      startLearning()
      return
    }
    setShowUseModal(true)
    setUseModalState('confirm')
    setUseModalTitle('Use this path')
    setUseModalMessage('将该路径保存到你的 My Paths？')
    setUseModalHint('保存后可在 My Paths 中查看与编辑。')
  }

  function closeUseModal() {
    setShowUseModal(false)
    setUseModalHint('')
    setUseModalState('confirm')
  }

  async function confirmUseThisPath() {
    if (usingThisPath || !id) return
    if (!/^[0-9]+$/.test(id)) return

    setUsingThisPath(true)
    try {
      const nid = Number(id)
      const res = await attachPublicLearningPathToMe(nid)
      setUseModalState('done')
      setUseModalTitle(res?.already_exists ? '已保存' : '保存成功')
      setUseModalMessage(res?.already_exists ? '该路径已经在 My Paths 里了。' : '已保存到 My Paths。')
      setUseModalHint('')
      const nextId = res?.learning_path?.id
      if (typeof nextId === 'number') {
        navigate({ pathname: `/learningpath/${String(nextId)}`, search: '?from=my-paths' })
      }
    } catch (e: any) {
      setUseModalState('error')
      setUseModalTitle('保存失败')
      setUseModalMessage(String(e?.response?.data?.detail || e?.message || '保存失败'))
      setUseModalHint('')
    } finally {
      setUsingThisPath(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      {/* Header */}
      {loading && (
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-stone-400">Loading…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="py-12 rounded-md border border-red-100 bg-red-50/50 p-6 text-center">
          <p className="text-sm text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && path && (
        <>
          <section className="border-b border-border pb-8">
            <div className="grid gap-6 md:grid-cols-12 md:items-end">
              <div className="md:col-span-8">
                <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  {path.title || 'Learning Path'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {path.description || 'No description.'}
                </p>
              </div>
              <div className="md:col-span-4 md:flex md:justify-end md:items-end">
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
                  >
                    <Link to={fromMyPaths ? '/my-paths' : '/learningpool'}>
                      {fromMyPaths ? '返回 My Paths' : '返回 LearningPool'}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={
                      fromMyPaths
                        ? 'bg-[#8ecbff] text-white hover:bg-[#8ecbff]/90 hover:text-white border-0'
                        : 'bg-foreground text-background hover:bg-foreground/90 hover:text-background'
                    }
                    disabled={fromMyPaths ? false : usingThisPath}
                    onClick={fromMyPaths ? startLearning : startLearningFromPublic}
                  >
                    Start
                  </Button>

                  {!fromMyPaths && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
                      disabled={usingThisPath}
                      onClick={openUseThisPath}
                    >
                      {usingThisPath ? 'Saving…' : 'Use this path'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 border border-stone-200 bg-white text-stone-700 font-semibold">
                {path.category_name || 'Learning Path'}
              </span>
              <span className="px-2 py-1 border border-stone-200 bg-white text-stone-500">
                {path.is_public ? 'Public' : 'Private'}
              </span>
              <span className="px-2 py-1 border border-stone-200 bg-white text-stone-500">
                {modules.length} items
              </span>
            </div>
          </section>

          {/* Cover */}
          {path.cover_image_url && (
            <div className="relative h-44 bg-stone-100 overflow-hidden rounded-md">
              <img
                src={path.cover_image_url}
                alt={path.title}
                className="w-full h-full object-cover object-center"
              />
              {path.type && (
                <span className="absolute right-3 top-3 px-2 py-1 rounded-full border border-stone-200 bg-white/90 text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-700">
                  {path.type}
                </span>
              )}
            </div>
          )}

          {/* Items */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium tracking-[0.14em] uppercase text-foreground">
                  路径内容
                </h2>
                <p className="text-sm text-muted-foreground">{modules.length} modules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map(m => (
                <article
                  key={m.id}
                  className="rounded-md overflow-hidden bg-white border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => openResource(m)}
                >
                  <div className="overflow-hidden">
                    <div className="relative bg-stone-100 overflow-hidden" style={{ aspectRatio: '16/9', width: '100%' }}>
                      <img
                        src={moduleThumb(m)}
                        alt={m.title}
                        loading="lazy"
                        className="block w-full h-full object-contain"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f7f7f7' }}
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${typeBadgeClass(m.type)}`}>
                          {m.type}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="min-w-0">
                        <h3 className="text-foreground font-semibold line-clamp-2" title={m.title}>
                          {m.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2" title={m.summary}>
                          {m.summary || 'No summary.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {!loading && !error && !path && (
        <div className="rounded-md border border-stone-100 p-5">
          <div className="text-sm text-muted-foreground">
            未找到该 learning path（id: {id}）。你可以先从 LearningPool 里选择一个已有的卡片进入。
          </div>
        </div>
      )}

      {/* Use modal */}
      {showUseModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-md bg-white shadow-2xl border border-stone-100 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-stone-900 text-sm font-medium tracking-[0.14em] uppercase">
                {useModalTitle}
              </h2>
              <button
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"
                onClick={closeUseModal}
                disabled={usingThisPath}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-stone-700">{useModalMessage}</p>
              {useModalHint && <p className="text-sm text-stone-500">{useModalHint}</p>}
            </div>

            <div className="p-6 pt-0 flex items-center justify-end gap-3">
              {useModalState === 'confirm' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-stone-200 text-stone-600 hover:border-stone-400"
                    onClick={closeUseModal}
                    disabled={usingThisPath}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-foreground text-background hover:bg-foreground/90 border-0"
                    onClick={confirmUseThisPath}
                    disabled={usingThisPath}
                  >
                    {usingThisPath ? 'Saving…' : '保存到 My Paths'}
                  </Button>
                </>
              )}

              {useModalState !== 'confirm' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-stone-200 text-stone-600 hover:border-stone-400"
                  onClick={closeUseModal}
                >
                  确定
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}