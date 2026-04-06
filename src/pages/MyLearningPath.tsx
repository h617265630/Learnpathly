import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import {
  listMyLearningPaths,
  getMyLearningPathDetail,
  deleteMyLearningPath,
  type MyLearningPath,
} from '@/api/learningPath'
import { getResourceDetail, type DbResource } from '@/api/resource'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

// ─── Types ──────────────────────────────────────────────────────────────────

type UiPath = MyLearningPath & {
  _coverUrl?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizePathType(raw: unknown): string {
  return String(raw || '').trim().toLowerCase()
}

function typeLabel(raw: unknown): string {
  const t = normalizePathType(raw)
  if (t === 'linear path') return 'Linear'
  if (t === 'structured path') return 'Structured'
  if (t === 'partical pool') return 'Pool'
  return String(raw || '').trim() || 'Path'
}

function typeColor(raw: unknown): string {
  const t = normalizePathType(raw)
  if (t === 'linear path') return 'bg-cyan-50 text-cyan-700'
  if (t === 'structured path') return 'bg-violet-50 text-violet-700'
  if (t === 'partical pool') return 'bg-amber-50 text-amber-700'
  return 'bg-stone-100 text-stone-600'
}

function coverAccent(raw: unknown): string {
  const t = normalizePathType(raw)
  if (t === 'linear path') return 'bg-cyan-500'
  if (t === 'structured path') return 'bg-violet-500'
  if (t === 'partical pool') return 'bg-amber-500'
  return 'bg-stone-400'
}

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop'

// ─── Component ──────────────────────────────────────────────────────────────

export default function MyLearningPath() {
  const { isAuthed } = useAuth()
  const navigate = useNavigate()

  const [paths, setPaths] = useState<UiPath[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Auth guard
  useEffect(() => {
    if (!isAuthed) {
      navigate('/login', { replace: true })
    }
  }, [isAuthed, navigate])

  const loadPaths = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listMyLearningPaths()
      const rows: UiPath[] = Array.isArray(data) ? data : []

      // Fetch cover thumbnails in parallel
      await Promise.allSettled(
        rows.map(async (p) => {
          try {
            const explicitCover = String(p.cover_image_url || '').trim()
            if (explicitCover) {
              p._coverUrl = explicitCover
              return
            }
            const detail = await getMyLearningPathDetail(p.id)
            const items = Array.isArray(detail.path_items) ? detail.path_items : []
            let first = items[0]
            for (const it of items) {
              const a = Number((first as any)?.order_index)
              const b = Number((it as any)?.order_index)
              if (!first) { first = it; continue }
              if (Number.isFinite(b) && (!Number.isFinite(a) || b < a)) first = it
            }
            let thumb = String((first as any)?.resource_data?.thumbnail || '').trim()
            if (!thumb) {
              const rid = Number((first as any)?.resource_id)
              if (Number.isFinite(rid) && rid > 0) {
                try {
                  const r = await getResourceDetail(rid)
                  thumb = String(r?.thumbnail || '').trim()
                } catch { /* ignore */ }
              }
            }
            p._coverUrl = thumb
          } catch {
            p._coverUrl = ''
          }
        }),
      )

      setPaths(rows)
    } catch (e: any) {
      setError(String(e?.response?.data?.detail || e?.message || 'Failed to load paths'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthed) return
    void loadPaths()
  }, [isAuthed, loadPaths])

  function openDetail(id: number) {
    navigate({ pathname: `/learningpath/${id}`, search: '?from=my-paths' })
  }

  function openDeleteConfirm(id: number) {
    setDeleteId(id)
    setDeleteError('')
  }

  function closeDeleteConfirm() {
    if (deleteConfirming) return
    setDeleteId(null)
  }

  async function confirmDelete() {
    if (deleteId == null) return
    setDeleteConfirming(true)
    setDeleteError('')
    try {
      await deleteMyLearningPath(deleteId)
      await loadPaths()
      setDeleteId(null)
    } catch (e: any) {
      setDeleteError(String(e?.response?.data?.detail || e?.message || 'Failed to delete'))
    } finally {
      setDeleteConfirming(false)
    }
  }

  const linearPaths = paths.filter(p => normalizePathType((p as any)?.type) === 'linear path')
  const structuredPaths = paths.filter(p => normalizePathType((p as any)?.type) === 'structured path')
  const poolPaths = paths.filter(p => normalizePathType((p as any)?.type) === 'partical pool')

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Personal
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.92]">
                My<br />
                <span className="text-amber-500">Paths.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-xs text-stone-400">
                <span className="font-semibold text-stone-700">{paths.length}</span> learning paths
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-4">
            <Link
              to="/createpath"
              className="inline-flex items-center justify-center gap-2 transition-all duration-150 h-8 px-5 text-xs rounded-md font-semibold bg-amber-500 text-white hover:bg-amber-600"
            >
              + New path
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm text-stone-400">Loading your paths…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-12 rounded-md border border-red-100 bg-red-50/50 p-6 text-center">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && paths.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🛤️</div>
            <h3 className="text-base font-semibold text-stone-700 mb-1">No learning paths yet</h3>
            <p className="text-sm text-stone-400 mb-5">Create your first learning path and start building.</p>
            <Link
              to="/createpath"
              className="inline-flex items-center justify-center gap-2 transition-all duration-150 h-9 px-5 text-sm rounded-md font-semibold bg-amber-500 text-white hover:bg-amber-600"
            >
              Create your first path →
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && paths.length > 0 && (
          <div className="space-y-12">
            {/* Linear */}
            {linearPaths.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-5 ${coverAccent('linear path')} rounded-full`} />
                    <h2 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Linear</h2>
                  </div>
                  <span className="text-xs text-stone-400 font-medium">{linearPaths.length} paths</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {linearPaths.map(path => (
                    <article
                      key={path.id}
                      className="group rounded-md overflow-hidden bg-white border-t border-b border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => openDetail(path.id)}
                    >
                      <div className="relative aspect-video bg-stone-100 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                        <img
                          src={path._coverUrl || FALLBACK_THUMB}
                          alt={path.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 ${typeColor(path.type)}`}>
                            {typeLabel(path.type)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5">
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{path.title}</h3>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">{path.description || 'No description.'}</p>
                      </div>
                      <div className="px-3 pb-3 flex gap-2" onClick={e => e.stopPropagation()}>
                        <Link
                          to={`/learningpath/${path.id}/edit`}
                          className="flex items-center justify-center flex-1 h-7 text-[10px] font-semibold uppercase tracking-wider border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors rounded-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-sm border border-stone-200 text-[10px] font-semibold text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                          onClick={() => openDeleteConfirm(path.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Structured */}
            {structuredPaths.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-5 ${coverAccent('structured path')} rounded-full`} />
                    <h2 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Structured</h2>
                  </div>
                  <span className="text-xs text-stone-400 font-medium">{structuredPaths.length} paths</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {structuredPaths.map(path => (
                    <article
                      key={path.id}
                      className="group rounded-md overflow-hidden bg-white border-t border-b border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => openDetail(path.id)}
                    >
                      <div className="relative aspect-video bg-stone-100 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                        <img
                          src={path._coverUrl || FALLBACK_THUMB}
                          alt={path.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 ${typeColor(path.type)}`}>
                            {typeLabel(path.type)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5">
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-1 group-hover:text-violet-700 transition-colors">{path.title}</h3>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">{path.description || 'No description.'}</p>
                      </div>
                      <div className="px-3 pb-3 flex gap-2" onClick={e => e.stopPropagation()}>
                        <Link
                          to={`/learningpath/${path.id}/edit`}
                          className="flex items-center justify-center flex-1 h-7 text-[10px] font-semibold uppercase tracking-wider border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors rounded-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-sm border border-stone-200 text-[10px] font-semibold text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                          onClick={() => openDeleteConfirm(path.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Pool */}
            {poolPaths.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-5 ${coverAccent('partical pool')} rounded-full`} />
                    <h2 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Pool</h2>
                  </div>
                  <span className="text-xs text-stone-400 font-medium">{poolPaths.length} paths</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {poolPaths.map(path => (
                    <article
                      key={path.id}
                      className="group rounded-md overflow-hidden bg-white border-t border-b border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => openDetail(path.id)}
                    >
                      <div className="relative aspect-video bg-stone-100 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                        <img
                          src={path._coverUrl || FALLBACK_THUMB}
                          alt={path.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 ${typeColor(path.type)}`}>
                            {typeLabel(path.type)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5">
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{path.title}</h3>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">{path.description || 'No description.'}</p>
                      </div>
                      <div className="px-3 pb-3 flex gap-2" onClick={e => e.stopPropagation()}>
                        <Link
                          to={`/learningpath/${path.id}/edit`}
                          className="flex items-center justify-center flex-1 h-7 text-[10px] font-semibold uppercase tracking-wider border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors rounded-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-sm border border-stone-200 text-[10px] font-semibold text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                          onClick={() => openDeleteConfirm(path.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Delete confirm dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md bg-white shadow-2xl border border-stone-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Delete learning path?</h2>
              <button
                className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"
                onClick={closeDeleteConfirm}
                disabled={deleteConfirming}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-stone-600">This will permanently delete the path. This action cannot be undone.</p>
              {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={closeDeleteConfirm}
                disabled={deleteConfirming}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs bg-red-500 text-white hover:bg-red-600 border-0"
                onClick={confirmDelete}
                disabled={deleteConfirming}
              >
                {deleteConfirming ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}