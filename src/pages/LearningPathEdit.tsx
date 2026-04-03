import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { getMyLearningPathDetail, updateMyLearningPath } from '@/api/learningPath'
import { listCategories, type Category } from '@/api/category'
import { Button } from '@/components/ui/Button'

type PathMeta = {
  title: string
  description: string
  type: string
  isPublic: boolean
  categoryId: number | null
}

export default function LearningPathEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [pathMeta, setPathMeta] = useState<PathMeta>({
    title: '',
    description: '',
    type: 'linear path',
    isPublic: true,
    categoryId: null,
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')

  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    if (!id) return
    async function loadPath() {
      setLoading(true)
      try {
        const path = await getMyLearningPathDetail(Number(id))
        setPathMeta({
          title: String(path.title || ''),
          description: String(path.description || ''),
          type: String(path.type || 'linear path'),
          isPublic: Boolean(path.is_public),
          categoryId: (path as any).category_id ?? null,
        })
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    void loadPath()
  }, [id])

  async function handleSubmit() {
    if (!id || !pathMeta.title.trim() || pathMeta.categoryId == null) return
    setSaveError('')
    setSaving(true)
    try {
      const payload = {
        title: pathMeta.title,
        type: pathMeta.type,
        description: pathMeta.description,
        is_public: pathMeta.isPublic,
      }
      await updateMyLearningPath(Number(id), payload)
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
        <div className="text-stone-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Edit
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Edit
                <br />
                <span className="text-amber-500">Learning Path.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-md bg-white border border-stone-100 p-6 space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={pathMeta.title}
              onChange={(e) =>
                setPathMeta((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. AI Engineer Starter"
              className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
              Description
            </label>
            <textarea
              value={pathMeta.description}
              onChange={(e) =>
                setPathMeta((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              placeholder="Describe the goal and content of this learning path"
              className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                Type
              </label>
              <div className="relative">
                <select
                  value={pathMeta.type}
                  onChange={(e) =>
                    setPathMeta((prev) => ({ ...prev, type: e.target.value }))
                  }
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
              <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                Category *
              </label>
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
              {categoriesError && (
                <p className="text-[10px] text-red-500 mt-1">{categoriesError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-sm border border-stone-100 bg-stone-50/50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-stone-700">Visibility</p>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Public: appears in LearningPool · Private: only visible to you
              </p>
            </div>
            <button
              type="button"
              className={`relative h-7 w-14 rounded-full transition-colors focus:outline-none ${
                pathMeta.isPublic ? 'bg-amber-500' : 'bg-stone-300'
              }`}
              onClick={() =>
                setPathMeta((prev) => ({ ...prev, isPublic: !prev.isPublic }))
              }
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  pathMeta.isPublic ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="rounded-full bg-amber-500 text-white hover:bg-amber-600 font-semibold text-sm px-10 py-3 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-amber-500/20"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {saving ? 'Saving…' : 'Save Changes →'}
          </button>
        </div>
        {saveError && (
          <p className="text-sm text-red-500 text-right mt-2">{saveError}</p>
        )}
      </main>
    </div>
  )
}