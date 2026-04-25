import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, X, HelpCircle, CreditCard, Shield, Download, MessageCircle } from "lucide-react";

type BillingCycle = "monthly" | "yearly";

const trustSignals = [
  { icon: Shield, label: "No lock-in", desc: "Cancel anytime" },
  { icon: CreditCard, label: "Secure payment", desc: "Powered by Stripe" },
  { icon: Download, label: "Your data", desc: "Export anytime" },
  { icon: MessageCircle, label: "Get help", desc: "Support responds in 24h" },
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes — upgrade or downgrade anytime. Changes take effect immediately and we prorate the difference.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Nothing. Your data stays intact. You just lose access to features above your new plan limit.",
  },
  {
    q: "Do you offer refunds?",
    a: "Contact us within 7 days of payment and we'll issue a full refund, no questions asked.",
  },
];

function hasToken(): boolean {
  try {
    return Boolean(
      localStorage?.getItem?.("learnsmart_token") ||
        sessionStorage?.getItem?.("learnsmart_token")
    );
  } catch {
    return false;
  }
}

interface SubscriptionMeResponse {
  plan_code: string;
  expire_date?: string;
}

async function getMySubscription(): Promise<SubscriptionMeResponse | null> {
  try {
    if (!hasToken()) return null;
    const response = await fetch("/api/subscription/me", {
      headers: {
        Authorization: `Bearer ${
          localStorage.getItem("learnsmart_token") ||
          sessionStorage.getItem("learnsmart_token")
        }`,
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// ─── Pricing tiers ────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: "free",
    label: "Free",
    badge: null,
    price: { monthly: 0, yearly: 0 },
    description: "For trying out the platform.",
    features: [
      "Browse public resources & paths",
      "Create up to 2 learning paths",
      "Add up to 80 resources",
      "Track your progress anytime",
    ],
    cta: "Continue free",
    highlight: false,
  },
  {
    id: "pro",
    label: "Pro",
    badge: "Recommended",
    price: { monthly: 12, yearly: 120 },
    description: "For serious learners who want more.",
    features: [
      "Unlimited learning paths",
      "Unlimited resources",
      "Up to 5 private learning paths",
      "Advanced progress insights & history",
      "Priority support",
    ],
    cta: "Subscribe to Pro",
    highlight: true,
  },
  {
    id: "basic",
    label: "Basic",
    badge: null,
    price: { monthly: 6, yearly: 60 },
    description: "Pro features, simpler billing.",
    features: [
      "Unlimited learning paths",
      "Unlimited resources",
      "Up to 5 private learning paths",
      "Advanced progress insights & history",
      "Email support",
    ],
    cta: "Choose Basic",
    highlight: false,
  },
] as const;

const COMPARISON = [
  { feature: "Public resources & paths", free: true, pro: true },
  { feature: "Learning paths", free: "2", pro: "Unlimited" },
  { feature: "Resources", free: "80", pro: "Unlimited" },
  { feature: "Private learning paths", free: false, pro: "5" },
  { feature: "Progress tracking", free: true, pro: true },
  { feature: "Advanced progress insights", free: false, pro: true },
  { feature: "Priority support", free: false, pro: true },
];

// ─── Feature icon ─────────────────────────────────────────────────────────────

function FeatureCheck({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white">
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-stone-300">
        <X className="w-3 h-3" strokeWidth={3} />
      </span>
    );
  }
  return <span className="text-xs font-semibold text-stone-600">{value}</span>;
}

// ─── Plan card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  tier: (typeof TIERS)[number];
  billing: BillingCycle;
  isCurrent: boolean;
  onAction: () => void;
}

function PlanCard({ tier, billing, isCurrent, onAction }: PlanCardProps) {
  const price = tier.price[billing];

  return (
    <div
      className={`relative flex flex-col p-6 border-2 transition-all duration-200 ${
        tier.highlight
          ? "border-blue-500 bg-white"
          : "border-stone-100 bg-white hover:border-stone-200"
      }`}
    >
      {tier.highlight && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-1.5 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            {tier.badge}
          </span>
        </div>
      )}

      {/* Label */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-1 h-5 rounded-full ${
            tier.id === "pro" ? "bg-blue-500" : tier.id === "basic" ? "bg-amber-500" : "bg-stone-300"
          }`}
        />
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
          {tier.label}
        </span>
        {isCurrent && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-sm">
            Current
          </span>
        )}
      </div>

      {/* Price */}
      <div className="flex items-end gap-1 mb-1">
        <span className="text-5xl font-black tracking-tight text-stone-900">
          ${price}
        </span>
        <span className="text-sm text-stone-400 mb-2">
          / {billing === "yearly" ? "year" : "month"}
        </span>
      </div>

      {billing === "yearly" && tier.id !== "free" && (
        <p className="text-xs text-stone-400 mb-4">
          Billed annually · Save ${(tier.price.monthly * 12 - tier.price.yearly)}
        </p>
      )}
      {tier.id === "free" && (
        <p className="text-xs text-stone-400 mb-4">/ forever</p>
      )}

      <p className="text-sm text-stone-500 mb-6 leading-relaxed">
        {tier.description}
      </p>

      {/* Features */}
      <div className="space-y-2.5 mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">
          {tier.id === "free" ? "What's included" : "Everything in Free, plus"}
        </p>
        <ul className="space-y-2.5">
          {tier.features.map((feat) => (
            <li key={feat} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 rounded-full bg-stone-50 p-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span
                className={`text-sm leading-snug ${
                  tier.highlight ? "font-semibold text-stone-800" : "text-stone-600"
                }`}
              >
                {feat}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onAction}
        disabled={isCurrent}
        className={`w-full py-3 text-sm font-bold transition-all duration-150 rounded-sm mt-auto ${
          tier.highlight
            ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-500/20"
            : isCurrent
            ? "border-2 border-blue-300 bg-blue-50 text-blue-500 cursor-default"
            : "border-2 border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98]"
        }`}
      >
        {isCurrent ? "Current plan" : tier.cta}
        {!isCurrent && tier.highlight && (
          <span className="ml-1">→</span>
        )}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Plan() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [subscription, setSubscription] = useState<SubscriptionMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      if (!hasToken()) return;
      setLoading(true);
      try {
        const data = await getMySubscription();
        setSubscription(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void fetchSubscription();
  }, []);

  const currentPlanId = useMemo(() => {
    const code = String(subscription?.plan_code || "").trim().toLowerCase();
    if (!code) return "free";
    if (code.startsWith("basic_yearly") || code.startsWith("basic")) return "basic";
    if (code.startsWith("pro_")) return "pro";
    return "free";
  }, [subscription]);

  const currentPlanName = useMemo(() => {
    if (currentPlanId === "pro") return "Pro";
    if (currentPlanId === "basic") return "Basic";
    return "Free";
  }, [currentPlanId]);

  function isCurrent(tierId: string) {
    return currentPlanId === tierId;
  }

  function onAction(tierId: string) {
    if (isCurrent(tierId) || loading) return;
    alert("Checkout is coming soon.");
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Masthead ───────────────────────────────────────────────────── */}
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Pricing
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-stone-900 leading-[0.9]">
                Simple plans,
                <br />
                <span className="text-blue-500">serious learning.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                Free · Basic · Pro
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        {/* ── Billing toggle ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-14">
          <div className="inline-flex rounded-sm border border-stone-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${
                billingCycle === "monthly"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
              {billingCycle === "yearly" ? (
                <span className="inline-flex items-center rounded-sm bg-emerald-400 text-white px-1.5 py-0.5 text-[9px] font-black">
                  -17%
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-600">-17%</span>
              )}
            </button>
          </div>
          {subscription?.plan_code && (
            <div className="text-xs text-stone-400">
              <span className="font-semibold text-stone-700">{currentPlanName}</span>
              {subscription.expire_date && (
                <span className="mx-1">·</span>
              )}
              {subscription.expire_date && (
                <span>Renewal {formatDate(subscription.expire_date)}</span>
              )}
            </div>
          )}
        </div>

        {/* ── Pricing cards ───────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {TIERS.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              billing={billingCycle}
              isCurrent={isCurrent(tier.id)}
              onAction={() => onAction(tier.id)}
            />
          ))}
        </section>

        {/* ── Feature comparison ───────────────────────────────────────── */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-stone-900 rounded-full" />
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                Compare
              </span>
            </div>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="rounded-sm border border-stone-100 bg-white overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-0 border-b border-stone-100 bg-stone-50/0">
              <div className="col-span-5 px-6 py-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Feature
                </span>
              </div>
              <div className="col-span-3 px-4 py-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Free
                </span>
              </div>
              <div className="col-span-4 px-6 py-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                  Pro
                </span>
              </div>
            </div>
            {/* Data rows */}
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-12 gap-0 border-b border-stone-50 transition-colors ${
                  i % 2 === 0 ? "bg-white" : "bg-stone-50/30"
                }`}
              >
                <div className="col-span-5 px-6 py-4">
                  <span className="text-sm text-stone-700 font-medium">{row.feature}</span>
                </div>
                <div className="col-span-3 flex justify-center items-center py-4">
                  <FeatureCheck value={row.free} />
                </div>
                <div className="col-span-4 flex justify-center items-center py-4">
                  <FeatureCheck value={row.pro} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust signals ────────────────────────────────────────────── */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                Trust
              </span>
            </div>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <div
                  key={signal.label}
                  className="rounded-sm border border-stone-100 bg-white p-5 text-center hover:border-stone-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-50 mb-3">
                    <Icon className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="text-sm font-bold text-stone-800">{signal.label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{signal.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-violet-500 rounded-full" />
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                FAQ
              </span>
            </div>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="max-w-2xl space-y-0">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className={`border-b border-stone-100 py-5 ${
                  i === 0 ? "border-t border-stone-100" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-start gap-3 w-full text-left cursor-pointer"
                >
                  <span className="text-sm font-bold text-stone-800 leading-snug flex-1">
                    {faq.q}
                  </span>
                  <HelpCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 transition-colors duration-150 ${
                      openFaq === i ? "text-blue-500" : "text-stone-300"
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <p className="text-sm text-stone-500 mt-2 leading-relaxed pl-0">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-12 text-center border-t border-stone-100">
          <p className="text-sm text-stone-500 mb-4">
            Questions? We're happy to help.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors duration-150"
          >
            Contact support
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </section>
      </main>
    </div>
  );
}