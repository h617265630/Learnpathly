import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMySubscription, type SubscriptionMeResponse } from '@/api/subscription'

const ALL_PERMISSIONS = [
  { label: 'View public resources', plans: ['Free', 'Basic', 'Pro'] as const },
  { label: 'Preview learning paths', plans: ['Free', 'Basic', 'Pro'] as const },
  { label: 'Local notes', plans: ['Free', 'Basic', 'Pro'] as const },
  { label: 'All learning paths', plans: ['Basic', 'Pro'] as const },
  { label: 'Manage resources', plans: ['Basic', 'Pro'] as const },
  { label: 'Cloud notes sync', plans: ['Basic', 'Pro'] as const },
  { label: 'Progress tracking & export', plans: ['Basic', 'Pro'] as const },
  { label: 'Team collaboration & sharing', plans: ['Pro'] as const },
  { label: 'Custom paths & templates', plans: ['Pro'] as const },
  { label: 'Advanced search & filters', plans: ['Pro'] as const },
  { label: 'Priority support', plans: ['Pro'] as const },
]

function hasToken() {
  try {
    const storage = (globalThis as any).localStorage
    return Boolean(String(storage?.getItem?.('learnsmart_token') || '').trim())
  } catch {
    return false
  }
}

export default function AccountPlan() {
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState<SubscriptionMeResponse | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!hasToken()) return
    setLoadError('')
    getMySubscription()
      .then((data) => {
        setSubscription(data)
      })
      .catch(() => {
        setLoadError('Failed to load your current plan.')
      })
  }, [])

  const effectivePlan = subscription?.effective_plan || 'Free'
  const planCode = String(subscription?.plan_code || '')
  const purchasedText = planCode || '—'

  const expiresText = (() => {
    const iso = subscription?.current_period_end
    if (!iso) return ''
    const d = new Date(String(iso))
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString()
  })()

  const permissions = ALL_PERMISSIONS.map((p) => ({
    ...p,
    included: p.plans.includes(effectivePlan as any),
  }))

  return (
    <div>
      {/* Plan card */}
      <div className="mb-5 p-6 bg-white rounded-md border border-stone-100 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">
              Current plan
            </p>
            <p className="text-3xl font-black text-stone-900 font-serif tracking-tight">
              {effectivePlan}
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-sm border border-stone-200 bg-stone-50 text-xs font-bold text-stone-600 uppercase tracking-wider">
            {effectivePlan}
          </span>
        </div>

        {loadError && (
          <p className="text-xs text-red-500 py-2 px-3 border border-red-100 bg-red-50 rounded-sm">
            {loadError}
          </p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="px-4 py-3 bg-stone-50 rounded-sm border border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-1">
              Plan
            </p>
            <p className="text-sm font-semibold text-stone-900">{purchasedText}</p>
          </div>
          <div className="px-4 py-3 bg-stone-50 rounded-sm border border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-1">
              Expires
            </p>
            <p className="text-sm font-semibold text-stone-900">{expiresText || '—'}</p>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-3">
            Permissions
          </p>
          <ul className="space-y-2">
            {permissions.map((p) => (
              <li key={p.label} className="flex items-center gap-2.5 text-sm">
                <div
                  className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center ${
                    p.included ? 'bg-emerald-100' : 'bg-stone-100'
                  }`}
                >
                  {p.included ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="oklch(55% 0.2 145)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="oklch(55% 0.02 250)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <span className={p.included ? 'text-stone-700' : 'text-stone-400'}>{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upgrade prompt */}
      {effectivePlan === 'Free' && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 mb-1">
            Upgrade available
          </p>
          <p className="text-sm text-stone-700 mb-3">
            Unlock team collaboration, custom paths, and priority support.
          </p>
          <button
            onClick={() => navigate('/plan')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all rounded-sm"
          >
            View Plans →
          </button>
        </div>
      )}
    </div>
  )
}