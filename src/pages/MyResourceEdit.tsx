import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { getMyResourceDetail, updateMyResource } from '@/api/resource'

export default function MyResourceEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const r = await getMyResourceDetail(Number(id))
        setTitle(String(r.title || ''))
        setSummary(String((r as any).summary || ''))
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
      await updateMyResource(Number(id), { title, summary })
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
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Edit
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Edit
                <br />
                <span className="text-indigo-600">Resource.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-md bg-white border border-stone-100 p-6 space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-4 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-colors"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" className="rounded-none" onClick={() => navigate('/my-resources')}>
            Cancel
          </Button>
          <Button
            className="rounded-none bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={!title.trim() || saving}
            onClick={handleSubmit}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 text-right mt-2">{error}</p>}
      </main>
    </div>
  )
}