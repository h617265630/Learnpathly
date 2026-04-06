import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronDown, Search, X, User, LogOut, LayoutDashboard, BookOpen, CreditCard, Settings } from 'lucide-react'
import {
  listMyResources,
  createMyResourceFromUrl,
  type DbResource,
} from '@/api/resource'
import {
  getMyLearningPathDetail,
  updateMyLearningPath,
} from '@/api/learningPath'
import { listCategories, type Category } from '@/api/category'
import { useAuth } from '@/stores/auth'
import { cn } from '@/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

type PathMeta = {
  title: string
  description: string
  type: string
  isPublic: boolean
  categoryId: number | null
  coverImageUrl: string
}

type ResourceType = 'video' | 'document' | 'article' | 'clip' | 'link'

type UiResource = {
  id: number
  title: string
  summary: string
  source_url: string | null
  type: ResourceType
  platform: string
  thumbnail: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePresentedType(raw: unknown): ResourceType {
  const t = String(raw || '').trim().toLowerCase()
  if (['video', 'document', 'article', 'clip', 'link'].includes(t)) return t as ResourceType
  return 'article'
}

function toUiResource(r: DbResource): UiResource {
  return {
    id: Number(r.id),
    title: String(r.title || '').trim() || `Resource ${r.id}`,
    summary: String((r as any).summary || '').trim(),
    source_url: (r as any).source_url ?? null,
    type: normalizePresentedType((r as any).resource_type),
    platform: String((r as any).platform || '').trim(),
    thumbnail: String((r as any).thumbnail || '').trim(),
  }
}

function toAbsoluteImageUrl(raw: unknown): string {
  const url = String(raw || '').trim()
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url
  return url
}

const USER_MENU_ITEMS = [
  { to: '/account/user-info', label: 'Account', icon: User },
  { to: '/my-paths', label: 'My Paths', icon: LayoutDashboard },
  { to: '/my-resources', label: 'My Resources', icon: BookOpen },
  { to: '/account/plan', label: 'Plan & Billing', icon: CreditCard },
  { to: '/account', label: 'Settings', icon: Settings },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LearningPathEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user, isAuthed, logout } = useAuth()

  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Path metadata
  const [pathMeta, setPathMeta] = useState<PathMeta>({
    title: '',
    description: '',
    type: 'linear path',
    isPublic: true,
    categoryId: null,
    coverImageUrl: '',
  })

  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')

  // Resources
  const [allResources, setAllResources] = useState<UiResource[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [newResourceUrl, setNewResourceUrl] = useState('')
  const [newResourceError, setNewResourceError] = useState('')
  const [newResourceLoading, setNewResourceLoading] = useState(false)

  // Selected resources (already in the path)
  const [selected, setSelected] = useState<UiResource[]>([])

  // Drag state
  const [selectedDragState, setSelectedDragState] = useState({ draggingId: -1, fromIndex: -1, overIndex: -1 })

  // Cover
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string>('')
  const [defaultCoverUrls, setDefaultCoverUrls] = useState<string[]>([])
  const coverFileInputRef = useRef<HTMLInputElement>(null)

  // Submit
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filtered resources
  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allResources
    return allResources.filter(r => r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q))
  }, [allResources, searchQuery])

  // Load categories
  useEffect(() => {
    async function load() {
      setCategoriesLoading(true)
      setCategoriesError('')
      try {
        const res = await listCategories()
        const cats = res ?? []
        setCategories(cats)
        if (pathMeta.categoryId == null) {
          const other = cats.find((c) => String((c as any).code || '').toLowerCase() === 'other')
          if (other) {
            setPathMeta((prev) => ({ ...prev, categoryId: other.id }))
          } else if (cats.length > 0) {
            setPathMeta((prev) => ({ ...prev, categoryId: cats[0].id }))
          }
        }
      } catch (e: any) {
        setCategoriesError(e?.message || 'Failed to load categories')
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    void load()
  }, [])

  // Load resources and path data
  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        // Load path details
        const path = await getMyLearningPathDetail(Number(id))
        setPathMeta({
          title: String(path.title || ''),
          description: String(path.description || ''),
          type: String(path.type || 'linear path'),
          isPublic: Boolean(path.is_public),
          categoryId: (path as any).category_id ?? null,
          coverImageUrl: String((path as any).cover_image_url || '').trim(),
        })

        // Load existing path resources from path_items
        const items = Array.isArray(path.path_items) ? path.path_items : []
        const selectedRes: UiResource[] = []
        for (const item of items) {
          const r = item.resource_data
          if (r) {
            selectedRes.push(toUiResource(r as unknown as DbResource))
          }
        }
        // Sort by order_index
        selectedRes.sort((a, b) => {
          const ia = items.findIndex((it: any) => Number(it.resource_id) === a.id)
          const ib = items.findIndex((it: any) => Number(it.resource_id) === b.id)
          return ia - ib
        })
        setSelected(selectedRes)

        // Load all user resources
        const rows = await listMyResources()
        const resources = Array.isArray(rows) ? rows.map(toUiResource) : []
        setAllResources(resources)
        const thumbs = resources.map(r => String(r.thumbnail || '').trim()).filter(Boolean)
        const unique: string[] = []
        for (const t of thumbs) {
          if (!unique.includes(t)) {
            unique.push(t)
            if (unique.length >= 20) break
          }
        }
        setDefaultCoverUrls(unique)
      } catch {
        setAllResources([])
        setSelected([])
        setDefaultCoverUrls([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  // Cover
  function selectCover(url: string) {
    setPathMeta((prev) => ({ ...prev, coverImageUrl: toAbsoluteImageUrl(url) }))
  }

  function openCoverFilePicker() {
    coverFileInputRef.current?.click()
  }

  function onCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '').trim()
      if (url) {
        setUploadedCoverUrl(url)
        selectCover(url)
      }
    }
    reader.readAsDataURL(file)
  }

  // Create resource from URL
  async function createResourceFromUrl() {
    setNewResourceError('')
    const raw = newResourceUrl.trim()
    if (!raw) return
    let parsed: URL
    try {
      parsed = new URL(raw)
    } catch {
      setNewResourceError('Invalid URL format. Please enter a full http(s) URL.')
      return
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      setNewResourceError('Only http(s) links are supported.')
      return
    }
    if (allResources.some(r => (r.source_url || '') === parsed.toString())) {
      setNewResourceError('This link already exists in your resource list.')
      return
    }
    if (pathMeta.categoryId == null) {
      setNewResourceError('Please select a category first.')
      return
    }
    setNewResourceLoading(true)
    setNewResourceError('')
    try {
      await createMyResourceFromUrl(parsed.toString(), { category_id: pathMeta.categoryId })
      setNewResourceUrl('')
      const rows = await listMyResources()
      setAllResources(Array.isArray(rows) ? rows.map(toUiResource) : [])
    } catch (e: any) {
      setNewResourceError(String(e?.response?.data?.detail || e?.message || 'Failed to generate resource'))
    } finally {
      setNewResourceLoading(false)
    }
  }

  // Selected resources
  function addResource(resource: UiResource) {
    if (selected.some(r => r.id === resource.id)) return
    setSelected(prev => [...prev, resource])
  }

  function removeResource(id: number) {
    setSelected(prev => prev.filter(r => r.id !== id))
  }

  function clearSelected() {
    setSelected([])
  }

  // Drag and drop
  function handleDragStart(e: React.DragEvent, resource: UiResource) {
    e.dataTransfer?.setData('text/plain', String(resource.id))
    e.dataTransfer!.effectAllowed = 'copy'
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const resourceId = e.dataTransfer?.getData('text/plain') || ''
    const n = Number(resourceId)
    const hit = Number.isFinite(n) ? allResources.find(r => r.id === n) : undefined
    if (hit) addResource(hit)
  }

  function moveSelected(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    const next = [...selected]
    const [item] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    setSelected(next)
  }

  function onSelectedDragStart(e: React.DragEvent, id: number, idx: number) {
    setSelectedDragState({ draggingId: id, fromIndex: idx, overIndex: idx })
    e.dataTransfer?.setData('application/x-selected-resource-id', String(id))
    e.dataTransfer?.setData('application/x-selected-resource-from', String(idx))
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  }

  function onSelectedDragOver(idx: number) {
    setSelectedDragState(prev => ({ ...prev, overIndex: idx }))
  }

  function onSelectedDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    const fromStr = e.dataTransfer?.getData('application/x-selected-resource-from') || ''
    if (!fromStr) return
    const fromIndex = Number(fromStr)
    if (Number.isFinite(fromIndex)) moveSelected(fromIndex, dropIndex)
  }

  function onSelectedDragEnd() {
    setSelectedDragState({ draggingId: -1, fromIndex: -1, overIndex: -1 })
  }

  // Submit
  async function handleSubmit() {
    if (!id || !pathMeta.title.trim() || pathMeta.categoryId == null) return
    setSaveError('')
    setSaving(true)
    try {
      const coverUrl = String(pathMeta.coverImageUrl || '').trim() || null
      await updateMyLearningPath(Number(id), {
        title: pathMeta.title,
        type: pathMeta.type,
        description: pathMeta.description,
        is_public: pathMeta.isPublic,
        cover_image_url: coverUrl,
      })
      navigate('/my-paths')
    } catch (e: any) {
      setSaveError(String(e?.response?.data?.detail || e?.message || 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = pathMeta.title.trim() && pathMeta.categoryId != null && !saving

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="inline-flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm text-stone-400">Loading...</span>
        </div>
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
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Edit
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Edit<br />
                <span className="text-amber-500">Learning Path.</span>
              </h1>
            </div>

            {/* User dropdown */}
            {isAuthed && (
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1.5 hover:border-stone-300 hover:bg-stone-50 transition-all"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user?.username || 'User'} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    ) : (
                      (user?.username || 'U').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-stone-400 transition-transform', userMenuOpen ? 'rotate-180' : '')} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-md border border-stone-100 bg-white shadow-xl z-50 py-1">
                      <div className="px-4 py-3 border-b border-stone-50 mb-1">
                        <p className="text-sm font-semibold text-stone-900">{user?.username || 'User'}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{user?.email || ''}</p>
                      </div>
                      <div className="py-1">
                        {USER_MENU_ITEMS.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <item.icon className="w-4 h-4 text-stone-400" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-stone-50 mt-1 pt-1 pb-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => { logout(); setUserMenuOpen(false); navigate('/home') }}
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Top meta panel */}
        <section className="bg-white rounded-md border border-stone-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Path Details</h2>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left: inputs */}
            <div className="col-span-12 lg:col-span-7 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={pathMeta.title}
                  onChange={(e) => setPathMeta((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. AI Engineer Starter"
                  className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Description</label>
                <textarea
                  value={pathMeta.description}
                  onChange={(e) => setPathMeta((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the goal and content of this learning path"
                  className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-colors"
                />
              </div>

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Type</label>
                  <div className="relative">
                    <select
                      value={pathMeta.type}
                      onChange={(e) => setPathMeta((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full h-10 px-3 pr-8 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer appearance-none"
                    >
                      <option value="linear path">Linear path</option>
                      <option value="partical pool">Partical pool</option>
                      <option value="structured path">Structured path</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={pathMeta.categoryId ?? ''}
                      onChange={(e) =>
                        setPathMeta((prev) => ({
                          ...prev,
                          categoryId: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      disabled={categoriesLoading || categories.length === 0}
                      className="w-full h-10 px-3 pr-8 border border-stone-200 rounded-sm bg-white text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                  {categoriesError && <p className="text-[10px] text-red-500 mt-1">{categoriesError}</p>}
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between rounded-sm border border-stone-100 bg-stone-50/50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-stone-700">Visibility</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Public: appears in LearningPool · Private: only visible to you</p>
                </div>
                <button
                  type="button"
                  className={`relative h-7 w-14 rounded-full transition-colors focus:outline-none ${
                    pathMeta.isPublic ? 'bg-amber-500' : 'bg-stone-300'
                  }`}
                  onClick={() => setPathMeta((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      pathMeta.isPublic ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Right: cover picker */}
            <div className="col-span-12 lg:col-span-5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Cover</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Preview */}
                <div className="rounded-sm overflow-hidden border border-stone-100">
                  <div className="aspect-video bg-stone-100">
                    {pathMeta.coverImageUrl ? (
                      <img
                        src={pathMeta.coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-contain"
                        style={{ objectFit: 'contain', backgroundColor: '#f7f7f7' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-300"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-stone-50/50 text-center">
                    <p className="text-[10px] text-stone-400">Current cover</p>
                  </div>
                </div>
                {/* Grid of defaults or uploaded */}
                <div className="space-y-2">
                  {uploadedCoverUrl ? (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        className={`rounded-sm overflow-hidden border-2 transition-all ${
                          pathMeta.coverImageUrl === uploadedCoverUrl ? 'border-amber-500' : 'border-stone-200 hover:border-stone-300'
                        }`}
                        onClick={() => selectCover(uploadedCoverUrl)}
                      >
                        <div className="aspect-video bg-stone-100">
                          <img
                            src={uploadedCoverUrl}
                            alt="Uploaded"
                            className="w-full h-full object-contain"
                            style={{ objectFit: 'contain', backgroundColor: '#f7f7f7' }}
                          />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {defaultCoverUrls.map((u, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`rounded-sm overflow-hidden border-2 transition-all ${
                            pathMeta.coverImageUrl === u ? 'border-amber-500' : 'border-stone-200 hover:border-stone-300'
                          }`}
                          onClick={() => selectCover(u)}
                        >
                          <div className="aspect-video bg-stone-100">
                            <img
                              src={u}
                              alt={`Cover ${idx + 1}`}
                              className="w-full h-full object-contain"
                              style={{ objectFit: 'contain', backgroundColor: '#f7f7f7' }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onCoverFileChange}
                  />
                  <button
                    type="button"
                    className="w-full h-9 rounded-sm border border-dashed border-stone-300 bg-white text-xs font-semibold text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-1.5"
                    onClick={openCoverFilePicker}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources + Selected panels */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Left: available resources */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-md border border-stone-100 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Resources</h2>
                </div>
                <span className="text-xs text-stone-400">{filteredResources.length} available</span>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your resources..."
                  className="h-10 w-full pl-10 pr-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
                />
              </div>

              {/* Create resource from URL */}
              <div className="rounded-sm border border-stone-100 bg-stone-50/50 p-3.5 mb-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-2">Create from URL</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-9 flex-1 px-3 border border-stone-200 rounded-sm bg-white text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-400 transition-colors"
                  />
                  <button
                    type="button"
                    className="h-9 px-3 rounded-sm bg-stone-800 text-white text-xs font-semibold hover:bg-stone-700 transition-colors disabled:opacity-50"
                    disabled={!newResourceUrl.trim() || newResourceLoading}
                    onClick={createResourceFromUrl}
                  >
                    {newResourceLoading ? '…' : 'Generate'}
                  </button>
                </div>
                {newResourceError && <p className="text-[10px] text-red-500 mt-1.5">{newResourceError}</p>}
              </div>

              {/* Resource list */}
              <div className="max-h-105 overflow-y-auto space-y-2 pr-1 mb-3">
                {filteredResources.map((r) => (
                  <div
                    key={r.id}
                    className={`group rounded-sm border bg-white transition-all cursor-pointer overflow-hidden ${
                      selected.some(s => s.id === r.id)
                        ? 'border-emerald-200 opacity-50'
                        : 'border-stone-100 hover:border-stone-200 hover:shadow-sm'
                    }`}
                    draggable={!selected.some(s => s.id === r.id)}
                    onDragStart={(e) => !selected.some(s => s.id === r.id) && handleDragStart(e, r)}
                    onClick={() => !selected.some(s => s.id === r.id) && addResource(r)}
                  >
                    <div className="flex gap-3 p-3">
                      <div className="w-20 h-14 shrink-0 rounded-none overflow-hidden bg-stone-100">
                        <img
                          src={r.thumbnail}
                          alt={r.title}
                          className="w-full h-full object-contain"
                          style={{ objectFit: 'contain', backgroundColor: '#f7f7f7' }}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-stone-800 line-clamp-1 leading-snug">{r.title}</h3>
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{r.type}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">{r.summary}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredResources.length === 0 && (
                  <p className="text-xs text-stone-400 text-center py-8">No resources found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: selected resources */}
          <div className="col-span-12 lg:col-span-6">
            <div
              className={`bg-white rounded-md p-5 h-full ${
                selected.length > 0 ? 'border border-stone-100' : 'border border-dashed border-stone-100'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-stone-700">Selected</h2>
                  {selected.length > 0 && <span className="text-xs text-stone-400">{selected.length} items</span>}
                </div>
                {selected.length > 0 && (
                  <button
                    type="button"
                    className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 hover:text-red-500 transition-colors"
                    onClick={clearSelected}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selected.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <p className="text-sm text-stone-400 mt-2">Click a resource or drag it here</p>
                </div>
              ) : (
                <div className="max-h-150 overflow-y-auto space-y-2 pr-1 mb-3">
                  {selected.map((r, idx) => (
                    <div key={r.id} className="space-y-1.5">
                      {/* Resource card */}
                      <div
                        className="flex gap-3 rounded-sm border border-stone-100 bg-white shadow-sm cursor-move transition-all hover:shadow-md"
                        draggable
                        onDragStart={(e) => onSelectedDragStart(e, r.id, idx)}
                        onDragEnd={onSelectedDragEnd}
                        onDragOver={(e) => { e.preventDefault(); onSelectedDragOver(idx) }}
                        onDrop={(e) => onSelectedDrop(e, idx)}
                      >
                        {/* Order number */}
                        <div className="w-8 h-full shrink-0 flex items-center justify-center bg-stone-50 rounded-l-lg">
                          <span className="text-xs font-black text-stone-400">{idx + 1}</span>
                        </div>
                        <div className="w-16 h-14 shrink-0 rounded-none overflow-hidden bg-stone-100 my-2">
                          <img
                            src={r.thumbnail}
                            alt={r.title}
                            className="w-full h-full object-contain"
                            style={{ objectFit: 'contain', backgroundColor: '#f7f7f7' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 py-2.5 pr-3">
                          <h3 className="text-xs font-bold text-stone-800 line-clamp-1 leading-snug">{r.title}</h3>
                          <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{r.summary}</p>
                        </div>
                        <button
                          type="button"
                          className="self-center mr-2 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          onClick={() => removeResource(r.id)}
                          aria-label="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Drop zone between items */}
                      {idx !== selected.length - 1 && (
                        <div
                          className="flex justify-center py-0.5"
                          onDragOver={(e) => { e.preventDefault(); onSelectedDragOver(idx + 1) }}
                          onDrop={(e) => onSelectedDrop(e, idx + 1)}
                        >
                          <div
                            className={`h-1 w-8 rounded-full bg-stone-100 transition-colors ${
                              selectedDragState.overIndex === idx + 1 ? 'bg-amber-300' : ''
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-full bg-amber-500 text-white hover:bg-amber-600 font-semibold text-sm px-10 py-3 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-amber-500/20"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {saving ? 'Saving…' : 'Save Changes →'}
          </button>
        </div>
        {saveError && <p className="text-sm text-red-500 text-right mt-2">{saveError}</p>}
      </main>
    </div>
  )
}
