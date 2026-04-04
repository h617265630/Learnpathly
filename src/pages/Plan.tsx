import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

type BillingCycle = 'monthly' | 'yearly'
type Feature = { label: string }
type PlanData = { features: Feature[] }

interface SubscriptionMeResponse {
  plan_code: string
  expire_date?: string
}

const trustSignals = [
  { icon: '🔒', label: 'No lock-in', desc: 'Cancel anytime' },
  { icon: '💳', label: 'Secure payment', desc: 'Powered by Stripe' },
  { icon: '📦', label: 'Your data', desc: 'Export anytime' },
  { icon: '💬', label: 'Get help', desc: 'Support responds in 24h' },
]

const faqs = [
  { q: 'Can I switch plans later?', a: 'Yes — upgrade or downgrade anytime. Changes take effect immediately and we prorate the difference.' },
  { q: 'What happens to my data if I downgrade?', a: 'Nothing. Your data stays intact. You just lose access to features above your new plan limit.' },
  { q: 'Do you offer refunds?', a: 'Contact us within 7 days of payment and we\'ll issue a full refund, no questions asked.' },
]

function hasToken(): boolean {
  try {
    const local = (globalThis as any).localStorage
    const session = (globalThis as any).sessionStorage
    return Boolean(local?.getItem?.('learnsmart_token') || session?.getItem?.('learnsmart_token'))
  } catch { return false }
}

async function getMySubscription(): Promise<SubscriptionMeResponse | null> {
  try {
    const token = hasToken()
    if (!token) return null

    const response = await fetch('/api/subscription/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('learnsmart_token') || sessionStorage.getItem('learnsmart_token')}`,
      },
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export default function Plan() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly')
  const [subscription, setSubscription] = useState<SubscriptionMeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchSubscription() {
      if (!hasToken()) return
      setLoading(true)
      try {
        const data = await getMySubscription()
        setSubscription(data)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    void fetchSubscription()
  }, [])

  const currentPlanId = useMemo(() => {
    const code = String(subscription?.plan_code || '').trim().toLowerCase()
    if (!code) return 'free'
    if (code.startsWith('basic_yearly') || code.startsWith('basic')) return 'basic'
    if (code.startsWith('pro_')) return 'pro'
    return 'free'
  }, [subscription])

  const currentPlan = useMemo(() => {
    if (currentPlanId === 'pro') return 'Pro'
    if (currentPlanId === 'basic') return 'Basic'
    return 'Free'
  }, [currentPlanId])

  const freePlan = useMemo<PlanData>(() => ({
    features: [
      { label: 'Browse public resources & paths' },
      { label: 'Create up to 2 learning paths' },
      { label: 'Add up to 80 resources' },
      { label: 'Track your progress anytime' },
    ],
  }), [])

  const proPlan = useMemo<PlanData>(() => ({
    features: [
      { label: 'Unlimited learning paths' },
      { label: 'Unlimited resources' },
      { label: 'Up to 5 private learning paths' },
      { label: 'Advanced progress insights & history' },
      { label: 'Priority support' },
    ],
  }), [])

  const basicPlan = useMemo<PlanData>(() => ({
    features: [
      { label: 'Unlimited learning paths' },
      { label: 'Unlimited resources' },
      { label: 'Up to 5 private learning paths' },
      { label: 'Advanced progress insights & history' },
      { label: 'Email support' },
    ],
  }), [])

  const comparisonRows = useMemo(() => [
    { feature: 'Public resources & paths', free: true, pro: true },
    { feature: 'Learning paths', free: '2', pro: 'Unlimited' },
    { feature: 'Resources', free: '80', pro: 'Unlimited' },
    { feature: 'Private learning paths', free: false, pro: '5' },
    { feature: 'Progress tracking', free: true, pro: true },
    { feature: 'Advanced progress insights', free: false, pro: true },
    { feature: 'Priority support', free: false, pro: true },
  ], [])

  function isCurrent(planId: string) { return currentPlanId === planId }

  function onAction(planId: string) {
    if (isCurrent(planId) || loading) return
    alert('Checkout is coming soon.')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Masthead */}
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-blue-600"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Pricing</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Simple plans,<br/><span className="text-blue-600">serious learning.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Free · Basic · Pro</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* Billing toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-12">
          <div className="inline-flex rounded-sm border border-stone-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              {billingCycle === 'yearly' ? (
                <span className="inline-flex items-center rounded-sm bg-emerald-400 text-white px-1.5 py-0.5 text-[9px] font-black">-17%</span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-600">-17%</span>
              )}
            </button>
          </div>
          {subscription?.plan_code && (
            <div className="text-xs text-stone-400">
              <span className="font-semibold text-stone-700">{currentPlan}</span>
              · Renewal {formatDate(subscription.expire_date)}
            </div>
          )}
        </div>

        {/* Plans: numbered editorial layout */}
        <section className="grid grid-cols-12 gap-5 mb-16">

          {/* Free — 01 */}
          <div className="col-span-12 lg:col-span-3 relative">
            <div className="relative pt-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-stone-300 rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Free</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black tracking-tight text-stone-900">$0</span>
                <span className="text-sm text-stone-400 mb-2">/ forever</span>
              </div>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">For trying out the platform.</p>

              <div className="space-y-2 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">What's included</p>
                <ul className="space-y-2.5">
                  {freePlan.features.map((feat) => (
                    <li key={feat.label} className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 rounded-full bg-stone-100 p-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <span className="text-sm text-stone-600 leading-snug">{feat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`w-full rounded-sm border-2 py-2.5 text-sm font-bold transition-all ${isCurrent('free') ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'}`}
                onClick={() => onAction('free')}
              >
                {isCurrent('free') ? 'Current plan' : 'Continue free'}
              </button>
            </div>
          </div>

          {/* Pro — 02 (dominant) */}
          <div className="col-span-12 lg:col-span-6 relative">
            <div className="relative pt-4 rounded-md border-2 border-blue-500 bg-white shadow-xl shadow-blue-500/5 overflow-hidden">

              <div className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-sm border border-blue-200 bg-blue-50 px-2.5 py-1 mb-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Recommended</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Pro</span>
                    </div>
                  </div>
                  {isCurrent('pro') && (
                    <div className="rounded-sm border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                      Current
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-1 mb-1">
                  <span className="text-6xl font-black tracking-tight text-stone-900">
                    {billingCycle === 'monthly' ? '$0' : '$0'}
                  </span>
                  <span className="text-sm text-stone-400 mb-2.5">
                    {billingCycle === 'monthly' ? '/ month' : '/ year'}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mb-8">
                  {billingCycle === 'yearly' ? 'Billed annually · Save $0/year' : 'Billed monthly · $0/year'}
                </p>

                <div className="space-y-2 mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Everything in Free, plus</p>
                  <ul className="space-y-2.5">
                    {proPlan.features.map((feat) => (
                      <li key={feat.label} className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 rounded-full bg-blue-50 p-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <span className="text-sm font-semibold text-stone-800 leading-snug">{feat.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className="w-full rounded-sm bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                  onClick={() => onAction('pro')}
                >
                  Subscribe to Pro →
                </button>
                <p className="text-center text-[11px] text-stone-400 mt-2">No commitment · Cancel anytime</p>
              </div>
            </div>
          </div>

          {/* Basic — 03 */}
          <div className="col-span-12 lg:col-span-3 relative">
            <div className="relative pt-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Basic</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black tracking-tight text-stone-900">$0</span>
                <span className="text-sm text-stone-400 mb-2">/ year</span>
              </div>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                {billingCycle === 'yearly' ? 'Billed annually · Save $0/yr' : '$0/month'} · Pro features, simpler billing
              </p>

              <div className="space-y-2 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Same as Pro, different cycle</p>
                <ul className="space-y-2.5">
                  {basicPlan.features.map((feat) => (
                    <li key={feat.label} className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 rounded-full bg-amber-50 p-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <span className="text-sm text-stone-600 leading-snug">{feat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`w-full rounded-sm border-2 py-2.5 text-sm font-bold transition-all ${isCurrent('basic') ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'}`}
                onClick={() => onAction('basic')}
              >
                {isCurrent('basic') ? 'Current plan' : 'Choose Basic'}
              </button>
            </div>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="mb-16">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-stone-900 rounded-full"></div>
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">Compare</span>
            </div>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          <div className="rounded-md border border-stone-100 bg-white overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-0 border-b border-stone-100 bg-stone-50/50">
              <div className="col-span-5 px-6 py-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Feature</span>
              </div>
              <div className="col-span-2 px-4 py-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Free</span>
              </div>
              <div className="col-span-5 px-6 py-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Pro</span>
              </div>
            </div>
            {/* Data rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-12 gap-0 border-b border-stone-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'}`}
              >
                <div className="col-span-5 px-6 py-4">
                  <span className="text-sm text-stone-700 font-medium">{row.feature}</span>
                </div>
                <div className="col-span-2 flex justify-center items-center py-4">
                  {row.free === true ? (
                    <span className="text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  ) : row.free === false ? (
                    <span className="text-stone-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-stone-500">{row.free}</span>
                  )}
                </div>
                <div className="col-span-5 flex justify-center items-center py-4">
                  {row.pro === true ? (
                    <span className="text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  ) : row.pro === false ? (
                    <span className="text-stone-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-blue-600">{row.pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust signals */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">Trust</span>
            </div>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-md border border-stone-100 bg-white p-5 text-center hover:border-stone-200 hover:shadow-sm transition-all"
              >
                <div className="text-2xl mb-2">{signal.icon}</div>
                <div className="text-sm font-bold text-stone-800">{signal.label}</div>
                <div className="text-xs text-stone-400 mt-0.5">{signal.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-violet-500 rounded-full"></div>
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">FAQ</span>
            </div>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          <div className="max-w-2xl space-y-0">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className={`border-b border-stone-100 py-5 ${i === 0 ? 'border-t border-stone-100' : ''}`}
              >
                <p className="text-sm font-bold text-stone-800 leading-snug">{faq.q}</p>
                <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}