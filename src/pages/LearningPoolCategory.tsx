import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
    <div className="border border-stone-100 bg-white rounded-xl overflow-hidden animate-pulse">
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
      <article className="border border-stone-100 bg-white hover:border-stone-200 hover:shadow-md transition-all duration-500 rounded-xl overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative bg-stone-100 overflow-hidden" style={{ width: '100%', aspectRatio: '16 / 9' }}>
          <img
            src={path.thumbnail || FALLBACK_THUMB}
            alt={path.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 flex-1 whitespace-pre-wrap">{path.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge variant="secondary" className="text-[10px]">{path.category}</Badge>
            <span className="text-[10px] text-stone-400">{path.level}</span>
            <span className="text-[10px] text-stone-400">{path.items} items</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function LearningPoolCategory() {
  const { category = '' } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const decodedCategory = decodeURIComponent(category)

  const [allPaths, setAllPaths] = useState<PoolPath[]>([])
  const [loading, setLoading] = useState(true)

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

  const filteredPaths = allPaths.filter(p => p.category === decodedCategory)

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      {/* Page header */}
      <section className="border-b border-stone-100 pb-8">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 md:text-2xl font-serif">
              Category: {decodedCategory}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
              Browse learning paths under this category.
            </p>
          </div>
          <div className="md:col-span-4 md:flex md:justify-end md:items-end">
            <Button
              onClick={() => navigate('/learningpool')}
              variant="outline"
              size="sm"
              className="rounded-none border-stone-300 hover:border-stone-400 hover:bg-stone-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
          </div>
        </div>
      </section>

      {/* Results header */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium tracking-[0.14em] uppercase text-stone-700">Results</h2>
            <p className="text-sm text-stone-500">{filteredPaths.length} paths</p>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Path grid */}
        {!loading && filteredPaths.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPaths.map((p) => (
              <PathCard key={`${p.id}-${p.category}`} path={p} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPaths.length === 0 && (
          <div className="border border-stone-100 bg-white rounded-xl p-6 text-center">
            <p className="text-sm text-stone-500">No learning paths found for category: {decodedCategory}.</p>
            <Button
              onClick={() => navigate('/createpath')}
              className="mt-4 rounded-none text-xs font-semibold bg-stone-900 hover:bg-stone-800"
            >
              Create a path →
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
