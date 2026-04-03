import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listPublicLearningPaths, type PublicLearningPath } from '@/api/learningPath'

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop'

const BANNER_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=900&q=80',
    title: 'Structured Learning Paths',
    description: 'A curriculum with modules and goals. Great for system-level skill building.',
  },
  {
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&h=900&q=80',
    title: 'Linear Learning Paths',
    description: 'Step-by-step, guided learning. Follow a clear sequence and finish with a complete outcome.',
  },
  {
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1600&h=900&q=80',
    title: 'Partical Pool',
    description: 'A flexible pool of resources. Collect links, articles, and clips, then revisit anytime.',
  },
] as const

type FeaturedPath = {
  id: string
  title: string
  description: string
  thumbnail: string
  level: string
  duration: string
  typeLabel: string
  category: string
}

function mapDbToFeatured(p: PublicLearningPath): FeaturedPath {
  const lpType = String(p.type || '').trim().toLowerCase()
  let typeLabel = 'Path'
  if (lpType.includes('linear')) typeLabel = 'Linear'
  else if (lpType.includes('struct')) typeLabel = 'Structured'
  else if (lpType.includes('partical') || lpType.includes('pool')) typeLabel = 'Pool'

  return {
    id: String(p.id),
    title: p.title || `Path ${p.id}`,
    description: p.description || '',
    thumbnail: p.cover_image_url || FALLBACK_THUMB,
    level: 'Beginner',
    duration: '',
    typeLabel,
    category: p.category_name || 'General',
  }
}

function pickRandom<T>(items: T[], count: number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, Math.min(count, arr.length))
}

// Skeleton loaders
function BannerSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-none mb-16 min-h-[380px] md:min-h-[440px] bg-stone-200 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 via-stone-900/30 to-transparent" />
    </div>
  )
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 md:col-span-8 rounded-md bg-stone-200 animate-pulse aspect-[16/7]" />
      <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
        <div className="h-20 rounded-md bg-stone-200 animate-pulse" />
        <div className="h-20 rounded-md bg-stone-200 animate-pulse" />
        <div className="h-20 rounded-md bg-stone-200 animate-pulse" />
      </div>
    </div>
  )
}

function PoolSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-md bg-stone-200 animate-pulse aspect-[4/5]" />
      ))}
    </div>
  )
}

export default function Home() {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [featuredPaths, setFeaturedPaths] = useState<FeaturedPath[]>([])
  const [randomPoolPaths, setRandomPoolPaths] = useState<FeaturedPath[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPool, setLoadingPool] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    if (prefersReducedMotion) {
      setIsPaused(true)
      return
    }

    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % BANNER_SLIDES.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function fetchPaths() {
      setLoading(true)
      setLoadingPool(true)
      try {
        const db = await listPublicLearningPaths()
        const mapped = (db || []).map(mapDbToFeatured)
        setFeaturedPaths(mapped.slice(0, 4))
        setRandomPoolPaths(pickRandom(mapped, 12))
      } catch {
        setFeaturedPaths([])
        setRandomPoolPaths([])
      } finally {
        setLoading(false)
        setLoadingPool(false)
      }
    }
    void fetchPaths()
  }, [])

  const isFirstSlide = activeBannerIndex === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 -mt-4 md:-mt-6">

      {/* Hero Banner */}
      <section
        className="relative overflow-hidden rounded-none mb-16 min-h-[380px] md:min-h-[440px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <img
          src={BANNER_SLIDES[activeBannerIndex].image}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />

        <div className="relative h-full min-h-[380px] md:min-h-[440px] flex flex-col justify-end pb-10 px-8 md:px-12">
          <div className="max-w-xl space-y-5">
            {/* Tag */}
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Learnpathly</span>
            </div>

            {isFirstSlide ? (
              <>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] text-white">
                  Build system-level skills with structured learning paths
                </h1>
                <p className="text-sm text-white/70 leading-relaxed max-w-md">
                  A Learning Path Platform: create and discover great learning paths, turn scattered knowledge into an actionable plan, and track progress as you improve over time.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to="/learningpool"
                    className="rounded-full bg-amber-500 text-white hover:bg-amber-400 px-6 py-2.5 text-sm font-semibold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-px"
                  >
                    Start exploring
                    <span aria-hidden> →</span>
                  </Link>
                  <Link
                    to="/about"
                    className="rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold transition-all"
                  >
                    About
                  </Link>
                  <Link
                    to="/createpath"
                    className="rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold transition-all"
                  >
                    Create path
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] text-white">
                  {BANNER_SLIDES[activeBannerIndex].title}
                </h1>
                <p className="text-sm text-white/70 leading-relaxed max-w-md">
                  {BANNER_SLIDES[activeBannerIndex].description}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to="/learningpool"
                    className="rounded-full bg-amber-500 text-white hover:bg-amber-400 px-6 py-2.5 text-sm font-semibold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-px"
                  >
                    Explore
                    <span aria-hidden> →</span>
                  </Link>
                  <Link
                    to="/createpath"
                    className="rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold transition-all"
                  >
                    Create one
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center gap-2 pt-8">
            {BANNER_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`transition-all duration-300 rounded-full ${i === activeBannerIndex ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActiveBannerIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Learning Paths: asymmetric editorial layout */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500 mb-2 block">Curated</span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-stone-900 leading-tight">Featured Paths</h2>
          </div>
          <Link
            to="/my-paths"
            className="rounded-sm text-stone-500 hover:text-stone-800 text-xs font-semibold uppercase tracking-widest transition-colors"
          >
            View all →
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading && featuredPaths.length === 0 ? (
          <FeaturedSkeleton />
        ) : featuredPaths.length > 0 ? (
          <div className="grid grid-cols-12 gap-4">
            {/* Hero card: spans 8 cols */}
            <Link
              to={`/learningpath/${featuredPaths[0].id}`}
              className="col-span-12 md:col-span-8 group block"
            >
              <div className="relative rounded-md overflow-hidden bg-stone-100 aspect-[16/7]">
                <img
                  src={featuredPaths[0].thumbnail || FALLBACK_THUMB}
                  alt={featuredPaths[0].title}
                  loading="lazy"
                  decoding="async"
                  className="block w-full h-full object-cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">{featuredPaths[0].level}</span>
                  <h3 className="text-white text-xl md:text-2xl font-semibold leading-tight mb-1">{featuredPaths[0].title}</h3>
                  <p className="text-white/60 text-sm line-clamp-1">{featuredPaths[0].description}</p>
                </div>
              </div>
            </Link>

            {/* Side stack: 4 cols */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
              {featuredPaths.slice(1, 4).map((path) => (
                <Link
                  key={path.id}
                  to={`/learningpath/${path.id}`}
                  className="group flex gap-3 items-center bg-white rounded-md border border-stone-100 p-3 hover:border-stone-200 hover:shadow-sm transition-all"
                >
                  <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-stone-100 shrink-0">
                    <img
                      src={path.thumbnail || FALLBACK_THUMB}
                      alt={path.title}
                      loading="lazy"
                      className="block w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-600 transition-colors">{path.title}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">{path.level}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-stone-200 py-16 text-center">
            <p className="text-sm text-stone-400">No paths published yet.</p>
            <Link
              to="/createpath"
              className="mt-3 rounded-sm text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors inline-block"
            >
              Be the first to create one →
            </Link>
          </div>
        )}
      </section>

      {/* LearningPool Picks: masonry with editorial text */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 mb-2 block">Discover</span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-stone-900 leading-tight">LearningPool Picks</h2>
            <p className="text-sm text-stone-500 mt-1">A curated collection to explore freely.</p>
          </div>
          <Link
            to="/learningpool"
            className="rounded-sm text-stone-500 hover:text-stone-800 text-xs font-semibold uppercase tracking-widest transition-colors"
          >
            Open pool →
          </Link>
        </div>

        {/* Pool grid */}
        {!loadingPool && randomPoolPaths.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {randomPoolPaths.map((path, idx) => (
              <Link
                key={`${path.id}-${idx}`}
                to={`/learningpath/${path.id}`}
                className="group block w-full min-w-0"
              >
                <div className="rounded-md overflow-hidden border border-stone-100 bg-white hover:border-stone-200 hover:shadow-md transition-all duration-200">
                  <div className="bg-stone-100" style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: '0.375rem' }}>
                    <img
                      src={path.thumbnail || FALLBACK_THUMB}
                      alt={path.title}
                      loading="lazy"
                      decoding="async"
                      className="block w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3
                      className="text-sm font-semibold text-stone-800 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors"
                      title={path.title}
                    >
                      {path.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">{path.description}</p>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{path.category}</span>
                        <span className="text-stone-200">·</span>
                        <span className="text-[10px] text-stone-400">{path.level}</span>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600 shrink-0">
                        {path.typeLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : !loadingPool ? (
          <div className="rounded-md border border-dashed border-stone-200 py-16 text-center">
            <p className="text-sm text-stone-400">Nothing in the pool yet.</p>
          </div>
        ) : (
          <PoolSkeleton />
        )}
      </section>

    </div>
  )
}
