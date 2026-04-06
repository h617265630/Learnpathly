import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createMyResourceFromUrl, extractVideoMetadata, type UrlExtractResponse } from '@/api/resource'
import { listCategories, type Category } from '@/api/category'
import { Button } from '@/components/ui/Button'
import { ResourceCard, type UiResource as RcResource } from '@/components/ResourceCard'

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop'

const SUPPORTED_PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'github', label: 'GitHub' },
  { key: 'medium', label: 'Medium' },
  { key: 'substack', label: 'Substack' },
  { key: 'devto', label: 'Dev.to' },
  { key: 'other', label: 'Other' },
]

const PLATFORM_PLACEHOLDERS: Record<string, string> = {
  youtube: 'https://www.youtube.com/watch?v=...',
  x: 'https://x.com/user/status/id',
  instagram: 'https://www.instagram.com/p/...',
  github: 'https://github.com/...',
  medium: 'https://medium.com/.../...',
  substack: 'https://xxx.substack.com/p/...',
  devto: 'https://dev.to/.../...',
  other: 'Paste a URL',
}

const WEIGHT_OPTIONS = [
  { value: 'soil', label: 'Soil' },
  { value: 'iron', label: 'Iron' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
]

function detectPlatformFromUrl(url: string) {
  const u = String(url || '').toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('x.com') || u.includes('twitter.com')) return 'x'
  if (u.includes('github.com')) return 'github'
  if (u.includes('medium.com')) return 'medium'
  if (u.includes('substack.com')) return 'substack'
  if (u.includes('dev.to')) return 'devto'
  return ''
}

function toManualWeight(w: string): number {
  if (w === 'gold') return 5
  if (w === 'silver') return 4
  if (w === 'bronze') return 3
  if (w === 'iron') return 2
  return 1
}

function formatExtractDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString()
}

function getErrorMessage(e: any, fallback: string) {
  const detail = e?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    return (first && (first.msg || first.message)) ? String(first.msg || first.message) : ''
  }
  return e?.message || fallback
}

function getCategoryColor(category?: string): string {
  const key = String(category || '').trim().toLowerCase() || 'other'
  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16']
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function getWeightCardClass(weight: string) {
  const w = toManualWeight(weight)
  if (w >= 5) return 'weight-gold'
  if (w === 4) return 'weight-silver'
  if (w === 3) return 'weight-bronze'
  if (w === 2) return 'weight-iron'
  return ''
}

export default function AddResource() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [selectedPlatform, setSelectedPlatform] = useState('youtube')
  const [urlInput, setUrlInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extractedMeta, setExtractedMeta] = useState<UrlExtractResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [selectedWeight, setSelectedWeight] = useState('')

  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successToastText, setSuccessToastText] = useState('')
  const extractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedPlatformLabel = SUPPORTED_PLATFORMS.find(p => p.key === selectedPlatform)?.label || ''
  const selectedPlatformPlaceholder = PLATFORM_PLACEHOLDERS[selectedPlatform] || 'Paste a URL'

  const weightPreviewClass = (() => {
    const w = selectedWeight
    if (w === 'soil') return 'border-stone-200 bg-stone-50'
    if (w === 'iron') return 'border-slate-300 bg-slate-50'
    if (w === 'bronze') return 'border-amber-300 bg-amber-50'
    if (w === 'silver') return 'border-zinc-200 bg-zinc-50'
    if (w === 'gold') return 'border-yellow-300 bg-yellow-50'
    return 'border-stone-200 bg-white'
  })()

  const weightTextClass = (() => {
    const w = selectedWeight
    if (w === 'gold') return 'text-amber-600'
    if (w === 'silver') return 'text-zinc-500'
    if (w === 'bronze') return 'text-amber-700'
    if (w === 'iron') return 'text-slate-500'
    return 'text-stone-500'
  })()

  const previewResource: RcResource = {
    id: 0,
    title: extractedMeta?.title || 'Untitled',
    summary: extractedMeta?.description || 'No description',
    categoryLabel: dbCategories.find(c => c.id === Number(categoryId))?.name || 'Other',
    categoryColor: getCategoryColor(dbCategories.find(c => c.id === Number(categoryId))?.name || 'Other'),
    platform: selectedPlatform,
    platformLabel: selectedPlatformLabel || 'video',
    typeLabel: selectedPlatformLabel.toLowerCase() || 'video',
    thumbnail: extractedMeta?.thumbnail_url || FALLBACK_THUMB,
    resource_type: selectedPlatformLabel.toLowerCase() || 'video',
  }

  // Load categories on mount
  useEffect(() => {
    listCategories()
      .then(cats => {
        setDbCategories(cats || [])
        const other = cats?.find(c => String(c.code).toLowerCase() === 'other')
        if (other && !categoryId) setCategoryId(String(other.id))
      })
      .catch(() => setDbCategories([]))
  }, [])

  // Apply prefilled URL from query params
  useEffect(() => {
    const q = searchParams.get('url')
    const next = Array.isArray(q) ? String(q[0] || '').trim() : String(q || '').trim()
    if (!next) return
    setUrlInput(next)
    const detected = detectPlatformFromUrl(next)
    if (detected) setSelectedPlatform(detected)
  }, [])

  // Auto-extract metadata when URL changes
  useEffect(() => {
    setExtractError('')
    setExtractedMeta(null)
    if (extractTimerRef.current) {
      clearTimeout(extractTimerRef.current)
      extractTimerRef.current = null
    }
    const raw = String(urlInput || '').trim()
    if (!raw) {
      setExtracting(false)
      return
    }
    setExtracting(true)
    extractTimerRef.current = setTimeout(() => {
      extractVideoMetadata(raw)
        .then(res => {
          setExtractedMeta(res)
          setExtracting(false)
        })
        .catch(err => {
          setExtractError(selectedPlatform === 'other' ? 'Not supported yet.' : getErrorMessage(err, 'Parse failed'))
          setExtracting(false)
        })
    }, 1200)
  }, [urlInput])

  async function confirmAdd() {
    if (!urlInput || !extractedMeta?.title) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const catId = categoryId ? Number(categoryId) : NaN
      if (!Number.isFinite(catId)) throw new Error('Please select a category')
      const manualWeight = toManualWeight(selectedWeight)
      await createMyResourceFromUrl(urlInput, {
        category_id: catId,
        is_public: isPublic,
        manual_weight: manualWeight,
      })
      navigate('/my-resources')
    } catch (e: any) {
      setSubmitError(getErrorMessage(e, 'Failed to add resource'))
    } finally {
      setSubmitting(false)
    }
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
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Add</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                New<br /><span className="text-violet-600">Resource.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">URL · File</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Mode tabs */}
        <div className="flex gap-1 mb-8 border-b border-stone-200">
          <button
            type="button"
            className="relative px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors text-stone-900"
          >
            From URL
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"></span>
          </button>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left: form */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Platform + URL input */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-violet-600 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Source</h2>
              </div>

              {/* Platform selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {SUPPORTED_PLATFORMS.map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedPlatform(p.key)}
                      className={`py-2 px-3 rounded-sm border text-[11px] font-semibold uppercase tracking-wider transition-all ${
                        selectedPlatform === p.key
                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                          : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Resource URL</label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder={selectedPlatformPlaceholder}
                    className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
                  />
                  {extracting && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse"></div>
                      <span className="text-xs text-stone-400">Parsing…</span>
                    </div>
                  )}
                </div>
                {extractError && <p className="mt-2 text-xs text-red-500">{extractError}</p>}
              </div>
            </div>

            {/* Metadata preview */}
            {extractedMeta && (
              <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Metadata</h2>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Thumbnail</label>
                  <div className="relative aspect-video w-full max-w-sm rounded-none overflow-hidden bg-stone-100">
                    {extractedMeta.thumbnail_url ? (
                      <img
                        src={extractedMeta.thumbnail_url}
                        alt={extractedMeta.title || 'thumbnail'}
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

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Title</label>
                  <p className="text-sm font-semibold text-stone-900">{extractedMeta.title || '—'}</p>
                </div>

                {/* Author + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">Author</label>
                    <p className="text-sm text-stone-700">{extractedMeta.author || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">Date</label>
                    <p className="text-sm text-stone-700">{formatExtractDate(extractedMeta.publish_date) || '—'}</p>
                  </div>
                </div>

                {/* Description */}
                {extractedMeta.description && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Description</label>
                    <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">{extractedMeta.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="bg-white rounded-md border border-stone-100 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-stone-300 rounded-full"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Options</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Category</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {dbCategories.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Visibility</label>
                  <div className="flex h-10 items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isPublic === true}
                        onChange={() => setIsPublic(true)}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-stone-600">Public</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isPublic === false}
                        onChange={() => setIsPublic(false)}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-stone-600">Private</span>
                    </label>
                  </div>
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
                        onClick={() => setSelectedWeight(w.value)}
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
            <div className="flex justify-end">
              <Button
                className="rounded-full bg-violet-600 text-white hover:bg-violet-700 font-semibold text-sm px-8 py-2.5 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!urlInput || extracting || !extractedMeta?.title || submitting}
                onClick={confirmAdd}
              >
                {submitting ? 'Saving…' : 'Add resource →'}
              </Button>
            </div>
            {submitError && <p className="text-sm text-red-500 text-right">{submitError}</p>}
          </div>

          {/* Right: live card preview */}
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Live preview</span>
              </div>
              <div className={getWeightCardClass(selectedWeight)}>
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

      {/* Success toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-stone-900 text-white px-6 py-3 shadow-2xl flex items-center gap-3">
          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span className="text-sm font-semibold">{successToastText}</span>
          <button className="text-stone-400 hover:text-white ml-1" onClick={() => setShowSuccessToast(false)} aria-label="Dismiss notification">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}