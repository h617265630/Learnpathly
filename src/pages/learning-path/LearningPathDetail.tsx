import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import {
  getPublicLearningPathDetail,
  getMyLearningPathDetail,
  attachPublicLearningPathToMe,
  type PublicLearningPathDetail,
} from '@/api/learningPath'
import { Button } from '@/components/ui/Button'
import { ResourceCard, type UiResource } from '@/components/ResourceCard'

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
  resourceData: any  // embedded resource_data from backend
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

function moduleToUiResource(m: Module): UiResource {
  const r = m.resourceData
  return {
    id: Number(m.resourceId) || 0,
    title: m.title,
    summary: m.summary,
    categoryLabel: r?.category_name || '',
    categoryColor: getCategoryColor(r?.category_name),
    platform: r?.platform || '',
    platformLabel: formatPlatform(r?.platform),
    typeLabel: m.type,
    thumbnail: moduleThumb(m),
    resource_type: m.type,
  }
}

function moduleThumb(m: Module): string {
  const r = m.resourceData
  const url = String(r?.thumbnail || '').trim()
  return url || FALLBACK_THUMB
}

function getCategoryColor(category?: string): string {
  const key = String(category || '').trim().toLowerCase() || 'other'
  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16']
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function formatPlatform(platform?: string | null): string {
  if (!platform) return ''
  const map: Record<string, string> = {
    youtube: 'YouTube', bilibili: 'Bilibili', jike: 'Jike',
    github: 'GitHub', douyin: 'Douyin', xiaohongshu: '小红书',
    wechat: 'WeChat', weibo: 'Weibo', podcast: 'Podcast',
    website: 'Website',
  }
  return map[platform.toLowerCase()] || platform
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

  const [usingThisPath, setUsingThisPath] = useState(false)
  const [showUseModal, setShowUseModal] = useState(false)
  const [useModalState, setUseModalState] = useState<'confirm' | 'done' | 'error'>('confirm')
  const [useModalTitle, setUseModalTitle] = useState('Use this path')
  const [useModalMessage, setUseModalMessage] = useState('Save this path to your My Paths?')
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
          resourceData: r,
        }
      })

      setModules(mapped)
    } catch (e: any) {
      setError(String(e?.response?.data?.detail || e?.message || 'Failed to load path'))
    } finally {
      setLoading(false)
    }
  }, [id, fromMyPaths])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

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
      setUseModalTitle('Failed to save')
      setUseModalMessage(String(e?.response?.data?.detail || e?.message || 'Failed to save'))
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
    setUseModalMessage('Save this path to your My Paths?')
    setUseModalHint('After saving, you can view and edit it in My Paths.')
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
      setUseModalTitle(res?.already_exists ? 'Already saved' : 'Saved')
      setUseModalMessage(res?.already_exists ? 'This path is already in your My Paths.' : 'Saved to My Paths.')
      setUseModalHint('')
      const nextId = res?.learning_path?.id
      if (typeof nextId === 'number') {
        navigate({ pathname: `/learningpath/${String(nextId)}`, search: '?from=my-paths' })
      }
    } catch (e: any) {
      setUseModalState('error')
      setUseModalTitle('Failed to save')
      setUseModalMessage(String(e?.response?.data?.detail || e?.message || 'Failed to save'))
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
                      {fromMyPaths ? 'Back to My Paths' : 'Back to LearningPool'}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={
                      fromMyPaths
                        ? 'bg-sky-300 text-white hover:bg-sky-300/90 hover:text-white border-0'
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
            <div className="relative h-72 bg-stone-100 overflow-hidden rounded-md">
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
                  Path Content
                </h2>
                <p className="text-sm text-muted-foreground">{modules.length} modules</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {modules.map(m => (
                <ResourceCard
                  key={m.id}
                  resource={moduleToUiResource(m)}
                  onOpen={() => openResource(m)}
                  onAdd={() => {}}
                  saving={false}
                  saved={false}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {!loading && !error && !path && (
        <div className="rounded-md border border-stone-100 p-5">
          <div className="text-sm text-muted-foreground">
            Learning path not found (id: {id}). You can select an existing card from LearningPool to enter.
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
                className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"
                onClick={closeUseModal}
                disabled={usingThisPath}
                aria-label="Close"
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
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-foreground text-background hover:bg-foreground/90 border-0"
                    onClick={confirmUseThisPath}
                    disabled={usingThisPath}
                  >
                    {usingThisPath ? 'Saving…' : 'Save to My Paths'}
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
                  OK
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}