import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  listResources,
  listMyResources,
  addPublicResourceToMyResourcesWithStatusAndWeight,
  type DbResource,
} from '@/api/resource'
import { listCategories, type Category } from '@/api/category'
import { formatPlatform } from '@/utils/platform'

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop'

type UiResource = {
  id: number
  title: string
  summary: string
  categoryLabel: string
  categoryColor: string
  platform: string
  platformLabel: string
  typeLabel: string
  thumbnail: string
  resource_type: string
}

function getCategoryColor(category?: string): string {
  const key = String(category || '').trim().toLowerCase() || 'other'
  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16']
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function normalizeResourceType(t: string): string {
  return String(t || '').trim().toLowerCase()
}

function displayResourceType(r: DbResource): string {
  const raw = normalizeResourceType(r.resource_type)
  if (raw === 'video' || raw === 'document' || raw === 'article') return raw
  return 'article'
}

function mapDbToUi(r: DbResource): UiResource {
  const categoryLabel = String((r as any).category_name || '').trim() || 'Other'
  return {
    id: r.id,
    title: r.title,
    summary: String(r.summary || '').trim(),
    categoryLabel,
    categoryColor: getCategoryColor(categoryLabel),
    platform: String((r as any).platform || '').trim(),
    platformLabel: formatPlatform((r as any).platform),
    typeLabel: displayResourceType(r),
    thumbnail: String(r.thumbnail || '').trim() || FALLBACK_THUMB,
    resource_type: r.resource_type,
  }
}

function SkeletonCard() {
  return (
    <div className="border border-stone-100 bg-white rounded-xl overflow-hidden animate-pulse">
      <div className="bg-stone-100" style={{ width: '100%', aspectRatio: '16 / 9' }} />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-stone-100 rounded w-1/3" />
        <div className="h-4 bg-stone-100 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-full" />
      </div>
    </div>
  )
}

function ResourceCard({
  resource,
  onOpen,
  onAdd,
  saving,
  saved,
}: {
  resource: UiResource
  onOpen: () => void
  onAdd: () => void
  saving: boolean
  saved: boolean
}) {
  return (
    <article className="group border border-stone-100 bg-white hover:border-stone-200 hover:shadow-md transition-all duration-500 rounded-xl overflow-hidden flex flex-col cursor-pointer"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative bg-stone-100 overflow-hidden" style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <img
          src={resource.thumbnail}
          alt={resource.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
            {resource.typeLabel}
          </Badge>
        </div>
        {/* Platform badge */}
        <div className="absolute top-2 right-2">
          <Badge className="text-[9px] uppercase tracking-wider bg-white/90 backdrop-blur-sm border-white/20">
            {resource.platformLabel}
          </Badge>
        </div>
        {/* Difficulty badge */}
        <div className="absolute bottom-2 left-2">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: resource.categoryColor + '18', color: resource.categoryColor }}
          >
            {resource.categoryLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3
          className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors flex-1"
          title={resource.title}
        >
          {resource.title}
        </h3>
        <p className="text-xs text-stone-500 line-clamp-2 mt-2">{resource.summary || 'No description available.'}</p>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-50">
          <span className="text-[10px] text-stone-400">{resource.platformLabel}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            disabled={saving || saved}
            className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              saved ? 'text-emerald-500' : 'text-amber-600 hover:text-amber-700'
            } disabled:opacity-50`}
          >
            {saved ? 'Saved' : saving ? 'Saving…' : '+ Save'}
          </button>
        </div>
      </div>
    </article>
  )
}

function HeroCard({
  resource,
  onOpen,
  onAdd,
  saving,
  saved,
}: {
  resource: UiResource
  onOpen: () => void
  onAdd: () => void
  saving: boolean
  saved: boolean
}) {
  return (
    <article
      className="group border border-stone-100 bg-white hover:border-stone-200 hover:shadow-xl transition-all duration-500 rounded-xl overflow-hidden cursor-pointer flex gap-0"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative bg-stone-100 overflow-hidden shrink-0" style={{ width: '50%', aspectRatio: '16 / 9' }}>
        <img
          src={resource.thumbnail}
          alt={resource.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">Hero</Badge>
          <Badge className="text-[9px] uppercase tracking-wider bg-white/90 backdrop-blur-sm border-white/20">
            {resource.typeLabel}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm"
            style={{ backgroundColor: resource.categoryColor + '18', color: resource.categoryColor }}
          >
            {resource.categoryLabel}
          </span>
          <h3
            className="text-lg font-bold text-stone-900 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors"
            title={resource.title}
          >
            {resource.title}
          </h3>
          <p className="text-sm text-stone-500 line-clamp-3">{resource.summary || 'No description available.'}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400">{resource.platformLabel}</span>
            <span className="text-xs text-stone-300">·</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{resource.typeLabel}</span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            disabled={saving || saved}
            className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
              saved ? 'text-emerald-500' : 'text-amber-600 hover:text-amber-700'
            } disabled:opacity-50`}
          >
            {saved ? 'Saved' : saving ? 'Saving…' : '+ Add to my resources'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function ResourceLibrary() {
  const navigate = useNavigate()

  const [resources, setResources] = useState<DbResource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeType, setActiveType] = useState('all')

  const [addingToMy, setAddingToMy] = useState<Record<number, boolean>>({})
  const [addedToMy, setAddedToMy] = useState<Record<number, boolean>>({})

  const [activeResourceId, setActiveResourceId] = useState<number | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const categoryOptions = useMemo(
    () => ['All', ...categories.map(c => c.name)],
    [categories]
  )

  const typeFilters = [
    { label: 'All', value: 'all' },
    { label: 'Video', value: 'video' },
    { label: 'Article', value: 'article' },
    { label: 'Document', value: 'document' },
  ]

  const uiResources = useMemo(() => resources.map(mapDbToUi), [resources])

  const filteredResources = useMemo(() => {
    return uiResources.filter(r => {
      // Filter out xiaohongshu and reddit
      const platform = r.platform.toLowerCase()
      if (platform === 'xiaohongshu' || platform === 'xhs' || platform.includes('小红书')) return false
      if (platform === 'reddit') return false

      // Category filter
      if (selectedCategory !== 'All' && r.categoryLabel !== selectedCategory) return false

      // Type filter
      if (activeType !== 'all' && r.typeLabel !== activeType) return false

      // Search filter
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true
      return r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)
    })
  }, [uiResources, selectedCategory, activeType, searchQuery])

  const activeResource = useMemo(() => {
    if (activeResourceId === null) return null
    return resources.find(r => r.id === activeResourceId) || null
  }, [activeResourceId, resources])

  useEffect(() => {
    Promise.all([listResources(), listCategories()])
      .then(([res, cats]) => {
        setResources(res || [])
        setCategories(cats || [])
      })
      .catch(() => {
        setResources([])
        setCategories([])
      })
      .finally(() => setLoading(false))

    // Sync which resources are already added
    listMyResources()
      .then(mine => {
        const next: Record<number, boolean> = {}
        for (const r of mine || []) {
          if (r?.id) next[r.id] = true
        }
        setAddedToMy(next)
      })
      .catch(() => {})
  }, [])

  function openCard(resource: UiResource) {
    setActiveResourceId(resource.id)
  }

  function closeActiveResource() {
    setActiveResourceId(null)
  }

  function seeDetail(resource: UiResource) {
    closeActiveResource()
    const t = resource.typeLabel
    const name = t === 'video' ? 'resource-video' : t === 'document' ? 'resource-document' : 'resource-article'
    navigate(`/resources/${t}/${resource.id}`)
  }

  async function addToMyResources(resource: UiResource) {
    if (!resource?.id) return
    if (addingToMy[resource.id] || addedToMy[resource.id]) return
    setAddingToMy(prev => ({ ...prev, [resource.id]: true }))
    try {
      const result = await addPublicResourceToMyResourcesWithStatusAndWeight(resource.id, { manual_weight: 1 })
      setAddedToMy(prev => ({ ...prev, [resource.id]: true }))
      if (result?.already_exists) {
        showToastMessage('Already Saved', 'This resource is already in your My Resources.')
      } else {
        showToastMessage('Saved!', 'Resource added to My Resources.')
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to save'
      showToastMessage('Failed', String(msg))
    } finally {
      setAddingToMy(prev => ({ ...prev, [resource.id]: false }))
    }
  }

  function showToastMessage(title: string, message: string) {
    setToastMessage(`${title}: ${message}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Masthead header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Discover</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.92]">
                Resource<br /><span className="text-amber-600">Library.</span>
              </h1>
            </div>
            <p className="hidden md:block text-sm leading-relaxed text-stone-500 max-w-xs">
              Browse and discover public resources. Add them to your personal library with one click.
            </p>
          </div>

          {/* Filter bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search resources, topics..."
                className="h-10 w-full rounded-none border border-stone-200 bg-white pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-colors"
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="appearance-none h-10 rounded-none border border-stone-200 bg-white pl-4 pr-10 text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-colors cursor-pointer"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Type pills */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {typeFilters.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveType(t.value)}
                className={`h-7 rounded-sm border px-3 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  activeType === t.value
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-500 hover:border-stone-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-sm text-stone-400">Loading resources…</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredResources.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-base font-semibold text-stone-700 mb-1">No resources found</h3>
            <p className="text-sm text-stone-400">
              {searchQuery || selectedCategory !== 'All' ? 'Try adjusting your filters.' : 'Nothing public yet.'}
            </p>
          </div>
        )}

        {/* Resource grid */}
        {!loading && filteredResources.length > 0 && (
          <div>
            {/* Results count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs text-stone-400">
                <span className="font-semibold text-stone-600">{filteredResources.length}</span> resources
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('All') }}
                className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors"
              >
                Clear filters
              </button>
            </div>

            {/* Editorial grid: alternating hero and standard cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredResources.map((resource, idx) => {
                const isHero = idx % 7 === 0 && idx > 0
                const saving = !!addingToMy[resource.id]
                const saved = !!addedToMy[resource.id]

                if (isHero) {
                  return (
                    <div key={resource.id} className="col-span-5">
                      <HeroCard
                        resource={resource}
                        onOpen={() => openCard(resource)}
                        onAdd={() => addToMyResources(resource)}
                        saving={saving}
                        saved={saved}
                      />
                    </div>
                  )
                }

                return (
                  <div key={resource.id} className="col-span-1">
                    <ResourceCard
                      resource={resource}
                      onOpen={() => openCard(resource)}
                      onAdd={() => addToMyResources(resource)}
                      saving={saving}
                      saved={saved}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {activeResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeActiveResource}>
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"></div>
          <div
            className="relative w-full max-w-lg rounded-md overflow-hidden bg-white shadow-2xl border border-stone-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Image header */}
            <div className="relative bg-stone-100 overflow-hidden" style={{ width: '100%', aspectRatio: '16 / 9' }}>
              <img
                src={activeResource.thumbnail || FALLBACK_THUMB}
                alt={activeResource.title}
                className="block w-full h-full object-contain"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <button
                className="absolute top-3 right-3 w-8 h-8 rounded-sm bg-white/90 backdrop-blur-sm flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white transition"
                onClick={closeActiveResource}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Category badge */}
              <div className="absolute bottom-3 left-3">
                {(() => {
                  const catLabel = String((activeResource as any).category_name || '').trim() || 'Other'
                  const catColor = getCategoryColor(catLabel)
                  return (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm"
                      style={{ backgroundColor: catColor + '18', color: catColor }}
                    >
                      {catLabel}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] text-stone-400">#{String(activeResource.id).padStart(3, '0')}</span>
                  <h2 className="text-xl font-bold text-stone-900 leading-tight mt-1">{activeResource.title}</h2>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-stone-600">{activeResource.summary || 'No description available.'}</p>

              <div className="flex items-center gap-4 mt-4 text-xs text-stone-400">
                <span>{formatPlatform((activeResource as any).platform)}</span>
                <span className="text-stone-200">·</span>
                <span className="font-medium text-stone-600 uppercase text-[10px] tracking-wider">
                  {displayResourceType(activeResource)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <Button
                onClick={() => seeDetail(mapDbToUi(activeResource))}
                className="w-full rounded-sm bg-stone-900 text-white hover:bg-stone-800 font-semibold text-sm transition-all"
              >
                View details
              </Button>
              <Button
                variant="outline"
                onClick={() => seeDetail(mapDbToUi(activeResource))}
                disabled={addingToMy[activeResource.id] || addedToMy[activeResource.id]}
                className="w-full rounded-sm border border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900 font-semibold text-sm transition-all"
              >
                {addedToMy[activeResource.id] ? 'Already saved' : (addingToMy[activeResource.id] ? 'Saving…' : '+ Save to my resources')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-sm bg-stone-900 text-white px-6 py-3 shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button className="text-stone-400 hover:text-white transition-colors ml-1" onClick={() => setShowToast(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}