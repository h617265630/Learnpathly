import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ResourceCard, type UiResource as RcResource } from '@/components/ResourceCard'
import { getMyResourceDetail, updateMyResource } from '@/api/resource'
import { listCategories, type Category } from '@/api/category'
import { formatPlatform } from '@/utils/platform'

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop'

const WEIGHT_OPTIONS = [
  { value: 'soil', label: 'Soil' },
  { value: 'iron', label: 'Iron' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
]

function toManualWeight(w: string): number {
  if (w === 'gold') return 5
  if (w === 'silver') return 4
  if (w === 'bronze') return 3
  if (w === 'iron') return 2
  return 1
}

function fromManualWeight(w: number | null | undefined): string {
  if (w === 5) return 'gold'
  if (w === 4) return 'silver'
  if (w === 3) return 'bronze'
  if (w === 2) return 'iron'
  return 'soil'
}

function getCategoryColor(category?: string): string {
  const key = String(category || '').trim().toLowerCase() || 'other'
  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16']
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function getWeightCardClass(weight: number | null | undefined) {
  const w = Number(weight)
  if (w >= 5) return 'weight-gold'
  if (w === 4) return 'weight-silver'
  if (w === 3) return 'weight-bronze'
  if (w === 2) return 'weight-iron'
  return ''
}

function getWeightPreviewClass(w: string) {
  if (w === 'soil') return 'border-stone-200 bg-stone-50'
  if (w === 'iron') return 'border-slate-300 bg-slate-50'
  if (w === 'bronze') return 'border-amber-300 bg-amber-50'
  if (w === 'silver') return 'border-zinc-200 bg-zinc-50'
  if (w === 'gold') return 'border-yellow-300 bg-yellow-50'
  return 'border-stone-200 bg-white'
}

function getWeightTextClass(w: string) {
  if (w === 'gold') return 'text-amber-600'
  if (w === 'silver') return 'text-zinc-500'
  if (w === 'bronze') return 'text-amber-700'
  if (w === 'iron') return 'text-slate-500'
  return 'text-stone-500'
}

export default function MyResourceEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [platform, setPlatform] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [manualWeight, setManualWeight] = useState('')
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedWeight = manualWeight || 'soil'
  const weightPreviewClass = getWeightPreviewClass(selectedWeight)
  const weightTextClass = getWeightTextClass(selectedWeight)

  const previewResource: RcResource = {
    id: Number(id) || 0,
    title: title || 'Untitled',
    summary: summary || 'No description',
    categoryLabel: categoryName || 'Other',
    categoryColor: getCategoryColor(categoryName),
    platform: platform || '',
    platformLabel: formatPlatform(platform),
    typeLabel: resourceType || 'video',
    thumbnail: thumbnail || FALLBACK_THUMB,
    resource_type: resourceType || 'video',
  }

  // Load categories
  useEffect(() => {
    listCategories()
      .then(cats => setDbCategories(cats || []))
      .catch(() => setDbCategories([]))
  }, [])

  // Load existing resource
  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const r = await getMyResourceDetail(Number(id))
        setTitle(String(r.title || ''))
        setSummary(String((r as any).summary || ''))
        setThumbnail(String(r.thumbnail || ''))
        setPlatform(String(r.platform || ''))
        setResourceType(String(r.resource_type || 'video'))
        setCategoryName(String((r as any).category_name || 'Other'))
        setIsPublic(Boolean((r as any).is_system_public))
        setManualWeight(fromManualWeight((r as any).manual_weight))
        // Try to match category ID
        const cats: Category[] = dbCategories.length ? dbCategories : await listCategories()
        const match = cats?.find((c: Category) => String(c.name).toLowerCase() === String((r as any).category_name || '').toLowerCase())
        if (match) setCategoryId(String(match.id))
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  async function handleSubmit() {
    if (!id || !title.trim()) return
    setError('')
    setSaving(true)
    try {
      const payload: Parameters<typeof updateMyResource>[1] = {
        title: title.trim(),
        summary: summary.trim() || null,
        manual_weight: toManualWeight(selectedWeight),
      }
      await updateMyResource(Number(id), payload)
      navigate('/my-resources')
    } catch (e: any) {
      setError(String(e?.response?.data?.detail || e?.message || 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-violet-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Edit</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Edit<br />
                <span className="text-violet-600">Resource.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Main grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left: form */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Source info (read-only) */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-stone-300 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Source</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Platform</label>
                  <p className="text-sm font-semibold text-stone-700">{formatPlatform(platform) || '—'}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Type</label>
                  <p className="text-sm font-semibold text-stone-700 capitalize">{resourceType || 'video'}</p>
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Thumbnail</label>
                <div className="relative aspect-video w-full max-w-sm rounded-none overflow-hidden bg-stone-100">
                  {thumbnail ? (
                    <img
                      src={thumbnail || FALLBACK_THUMB}
                      alt={title || 'thumbnail'}
                      className="w-full h-full object-contain bg-stone-50"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-300">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title & Summary */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-violet-600 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Details</h2>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-stone-300 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Options</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category (read-only display) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Category</label>
                  <p className="text-sm font-semibold text-stone-700">{categoryName || 'Other'}</p>
                </div>

                {/* Visibility (read-only display) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Visibility</label>
                  <p className="text-sm font-semibold text-stone-700">{isPublic ? 'Public' : 'Private'}</p>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Weight</label>
                <div className="flex gap-3 items-center">
                  <div className="flex gap-2 flex-wrap">
                    {WEIGHT_OPTIONS.map(w => (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => setManualWeight(w.value)}
                        className={`h-8 px-3 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all ${
                          selectedWeight === w.value
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-400'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                  {selectedWeight && (
                    <div
                      className={`ml-auto w-16 h-16 rounded-sm border-2 flex items-center justify-center text-[10px] font-black tracking-widest ${weightPreviewClass}`}
                    >
                      <span className={weightTextClass}>{selectedWeight.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="rounded-none" onClick={() => navigate('/my-resources')}>
                Cancel
              </Button>
              <Button
                className="rounded-full bg-violet-600 text-white hover:bg-violet-700 font-semibold text-sm px-8 py-2.5 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!title.trim() || saving}
                onClick={handleSubmit}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500 text-right">{error}</p>}
          </div>

          {/* Right: live preview */}
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Live preview</span>
              </div>
              <div className={getWeightCardClass(toManualWeight(selectedWeight))}>
                <ResourceCard
                  resource={previewResource}
                  onOpen={() => {}}
                  onAdd={() => {}}
                  saving={false}
                  saved={false}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}