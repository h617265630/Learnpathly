import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { listPublicLearningPaths, mapPublicLearningPathToDisplayBase, type PublicLearningPath } from '@/api/learningPath'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type PoolPath = {
  id: string
  title: string
  description: string
  category: string
  typeLabel: string
  level: string
  items: number
  thumbnail: string
  hotScore: number
}

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop'

function inferCategoryFromText(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('ai') || t.includes('llm') || t.includes('rag') || t.includes('agent')) return 'AI'
  if (t.includes('front') || t.includes('vue') || t.includes('react') || t.includes('css')) return 'Frontend'
  if (t.includes('back') || t.includes('api') || t.includes('fastapi') || t.includes('node')) return 'Backend'
  if (t.includes('devops') || t.includes('docker') || t.includes('k8s') || t.includes('kubernetes') || t.includes('ci')) return 'DevOps'
  if (t.includes('db') || t.includes('sql') || t.includes('database') || t.includes('postgres')) return 'Database'
  if (t.includes('design') || t.includes('figma') || t.includes('ux')) return 'Design'
  if (t.includes('product') || t.includes('pm') || t.includes('roadmap')) return 'Product'
  if (t.includes('career') || t.includes('resume') || t.includes('interview')) return 'Career'
  return 'Backend'
}

function mapDbToPool(p: PublicLearningPath): PoolPath {
  const base = mapPublicLearningPathToDisplayBase(p)
  const lpType = String(p.type || '').trim().toLowerCase()
  let typeLabel = 'Path'
  if (lpType.includes('linear')) typeLabel = 'Linear'
  else if (lpType.includes('struct')) typeLabel = 'Structured'
  else if (lpType.includes('partical') || lpType.includes('pool')) typeLabel = 'Pool'

  const title = base.title
  const description = base.description
  const cat = base.categoryName || inferCategoryFromText(`${title}\n${description}`)
  const thumbnail = base.thumbnail || FALLBACK_THUMB

  return {
    id: base.id,
    title,
    description: description || '（无介绍）',
    category: cat,
    typeLabel,
    level: 'Beginner',
    items: 0,
    thumbnail,
    hotScore: 50,
  }
}

function SkeletonCard() {
  return (
    <div className="border border-stone-100 bg-white rounded-md overflow-hidden animate-pulse">
      <div className="bg-stone-100" style={{ width: '100%', aspectRatio: '16 / 9' }} />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-stone-100 rounded w-1/3" />
        <div className="h-4 bg-stone-100 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-full" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 bg-stone-100 rounded w-16" />
          <div className="h-5 bg-stone-100 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

function PathCard({ path }: { path: PoolPath }) {
  return (
    <Link to={`/learningpath/${path.id}`} className="group block">
      <article className="border border-stone-100 bg-white hover:border-stone-200 hover:shadow-md transition-all duration-500 rounded-md overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative bg-stone-100 border-t border-b border-black" style={{ width: '100%', aspectRatio: '16 / 9' }}>
          <img
            src={path.thumbnail || FALLBACK_THUMB}
            alt={path.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {path.typeLabel && path.typeLabel !== 'Path' && (
            <span className="absolute right-3 top-3 px-2 py-1 rounded-full border border-stone-200 bg-white/90 text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-700">
              {path.typeLabel}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors"
              title={path.title}
            >
              {path.title}
            </h3>
          </div>
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 flex-1">{path.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge variant="secondary" className="text-[10px]">{path.category}</Badge>
            <span className="text-[10px] text-stone-400">{path.level}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function LearningPool() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(searchQuery)

  const [allPaths, setAllPaths] = useState<PoolPath[]>([])
  const [loading, setLoading] = useState(true)

  const [activeCategory, setActiveCategory] = useState('')
  const [activeType, setActiveType] = useState('all')

  useEffect(() => {
    setLoading(true)
    listPublicLearningPaths()
      .then((res) => {
        const paths = (res || []).map(mapDbToPool)
        setAllPaths(paths)
      })
      .catch(() => {
        setAllPaths([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Sync search input with URL param
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  const categories = useMemo(() => {
    const cats = new Set(allPaths.map((p) => p.category))
    return Array.from(cats).sort()
  }, [allPaths])

  const typeTabs = useMemo(() => [
    { key: 'all', label: 'All', count: allPaths.length },
    { key: 'linear', label: 'Linear', count: allPaths.filter(p => p.typeLabel === 'Linear').length },
    { key: 'structured', label: 'Structured', count: allPaths.filter(p => p.typeLabel === 'Structured').length },
    { key: 'pool', label: 'Pool', count: allPaths.filter(p => p.typeLabel === 'Pool').length },
  ], [allPaths])

  const hotPaths = useMemo(() =>
    [...allPaths].sort(() => Math.random() - 0.5).slice(0, 8),
    [allPaths]
  )

  const filteredPaths = useMemo(() => {
    let result = allPaths

    if (activeType !== 'all') {
      result = result.filter(p => p.typeLabel.toLowerCase() === activeType)
    }

    if (activeCategory) {
      result = result.filter(p => p.category === activeCategory)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }

    return result
  }, [allPaths, activeCategory, activeType, searchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    if (value) {
      setSearchParams({ search: value }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 -mt-4 md:-mt-6">

      {/* Page header */}
      <section className="mb-12">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500 mb-3 block">LearningPool</span>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 leading-[1.1] font-serif">
              Discover learning paths
            </h1>
            <p className="mt-3 text-sm text-stone-500 leading-relaxed max-w-lg">
              Browse curated paths across topics. Follow a structured path, or explore a flexible pool of resources at your own pace.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 flex items-center gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="search"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search paths..."
                aria-label="Search learning paths"
                className="w-full rounded-full border border-stone-200 bg-white pl-9 pr-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
            <Button asChild to="/createpath" className="rounded-full bg-stone-900 text-white hover:bg-stone-800 px-5 py-2.5 text-xs font-semibold">
              <>
                <Plus className="w-3.5 h-3.5" />
                New path
              </>
            </Button>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="mb-10">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveCategory('')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
              activeCategory === ''
                ? 'bg-stone-900 text-white border-stone-900'
                : 'border-stone-200 text-stone-500 bg-white hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-200 text-stone-500 bg-white hover:border-stone-300 hover:text-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Trending / Hot picks: horizontal scrollable strip */}
      {searchQuery === '' && hotPaths.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-500">Trending now</span>
            </div>
            <span className="text-xs text-stone-400">{hotPaths.length} paths</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {hotPaths.map((p) => (
              <Link
                key={p.id}
                to={`/learningpath/${p.id}`}
                className="group shrink-0 w-56 block"
              >
                <div className="bg-stone-100 rounded-md mb-3 overflow-hidden" style={{ width: '14rem', aspectRatio: '16 / 9' }}>
                  <img
                    src={p.thumbnail || FALLBACK_THUMB}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">{p.title}</h3>
                  <p className="text-xs text-stone-400">{p.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Type tabs */}
      {searchQuery === '' && (
        <section className="mb-8">
          <div className="border-b border-stone-100 flex items-center gap-0">
            {typeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveType(tab.key)}
                className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-150 -mb-px ${
                  activeType === tab.key
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-200'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] font-medium text-stone-300">{tab.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Filtered results count */}
      {searchQuery !== '' && (
        <section className="mb-6">
          <p className="text-sm text-stone-500">
            <span className="font-semibold text-stone-700">{filteredPaths.length}</span> results
            {searchQuery && (
              <> for "<span className="font-semibold text-stone-700">{searchQuery}</span>"</>
            )}
            {activeType !== 'all' && (
              <> in <span className="font-semibold text-stone-700">{activeType}</span></>
            )}
          </p>
        </section>
      )}

      {/* Loading skeleton */}
      {loading && (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      )}

      {/* Path grid */}
      {!loading && filteredPaths.length > 0 && (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPaths.map((p) => (
              <PathCard key={`${p.id}-${p.category}`} path={p} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && filteredPaths.length === 0 && (
        <section className="py-20 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-stone-700 mb-1">No paths found</h3>
          <p className="text-sm text-stone-400">
            {searchQuery ? 'Try a different search term.' : 'Be the first to create one in this category.'}
          </p>
          <Button asChild to="/createpath" className="mt-4 rounded-none text-xs font-semibold bg-stone-900 hover:bg-stone-800">
            <Link to="/createpath">Create a path →</Link>
          </Button>
        </section>
      )}
    </div>
  )
}
