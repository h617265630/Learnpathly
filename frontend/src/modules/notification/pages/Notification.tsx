import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/stores/auth";

type TextNotice = { id: string; date: string; title: string; body: string };
type ServiceNotice = TextNotice & {
  status: "operational" | "degraded" | "incident";
};

const platformUpdates: TextNotice[] = [
  {
    id: "pu1",
    date: "2026-01-31",
    title: "Learning path types are live",
    body: "LearningPool now groups paths by type (linear / structured / partical pool). You can pick a type when creating a path.",
  },
  {
    id: "pu2",
    date: "2026-01-31",
    title: "Refined UI consistency",
    body: "We improved typography and UI consistency across key pages for a cleaner experience.",
  },
];

const ruleChanges: TextNotice[] = [
  {
    id: "rc1",
    date: "2026-01-31",
    title: "Public content guidelines updated",
    body: "Public paths/resources should avoid sensitive content and include a clear title/description for discoverability.",
  },
];

const serviceStatus: ServiceNotice[] = [
  {
    id: "ss1",
    date: "2026-01-31",
    title: "Video metadata extraction",
    body: "Operational. Some platforms may have rate limits depending on availability.",
    status: "operational",
  },
];

function statusClasses(status: ServiceNotice["status"]) {
  if (status === "operational")
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "degraded")
    return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-red-100 bg-red-50 text-red-700";
}

function statusDotClass(status: ServiceNotice["status"]) {
  if (status === "operational") return "bg-emerald-500";
  if (status === "degraded") return "bg-amber-500";
  return "bg-red-500";
}

export default function Notification() {
  const { isAuthed } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Masthead */}
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-rose-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Updates
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-[0.9]">
                What's
                <br />
                <span className="text-rose-600">New.</span>
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                Platform · Rules · Status
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Platform Updates */}
        <section className="mb-14">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                Platform
              </span>
            </div>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          {/* Numbered editorial cards */}
          <div className="space-y-3">
            {platformUpdates.map((n, idx) => (
              <article
                key={n.id}
                className="group relative pl-14 py-6 border-b border-stone-100 hover:border-stone-200 transition-colors"
              >
                {/* Large index number */}
                <span
                  className="absolute left-0 top-4 text-[72px] font-black leading-none text-stone-100 select-none pointer-events-none group-hover:text-stone-200 transition-colors"
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <time className="text-xs text-stone-400 font-medium">
                      {n.date}
                    </time>
                    <span className="inline-flex items-center gap-1 rounded-sm border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                      New
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-sm text-stone-500 mt-2 leading-relaxed max-w-2xl">
                    {n.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Rules & Policies */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-8 bg-amber-600 rounded-full"></div>
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                Rules & Policy
              </span>
            </div>
            <div className="flex-1 h-px bg-stone-200"></div>
          </div>

          <div className="space-y-3">
            {ruleChanges.map((n, idx) => (
              <article
                key={n.id}
                className="group relative pl-14 py-6 border-b border-stone-100 hover:border-stone-200 transition-colors"
              >
                <span
                  className="absolute left-0 top-4 text-[72px] font-black leading-none text-stone-100 select-none pointer-events-none group-hover:text-stone-200 transition-colors"
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <time className="text-xs text-stone-400 font-medium">
                      {n.date}
                    </time>
                    <span className="inline-flex items-center gap-1 rounded-sm border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                      Policy
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    {n.title}
                  </h3>
                  <p className="text-sm text-stone-500 mt-2 leading-relaxed max-w-2xl">
                    {n.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Service Status */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-8 bg-emerald-600 rounded-full"></div>
              <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                Service Status
              </span>
            </div>
            <div className="flex-1 h-px bg-stone-200"></div>
            {/* Always-on status indicator */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                All operational
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {serviceStatus.map((s, idx) => (
              <article
                key={s.id}
                className="group relative pl-14 py-6 border-b border-stone-100 hover:border-stone-200 transition-colors"
              >
                <span
                  className="absolute left-0 top-4 text-[72px] font-black leading-none text-stone-100 select-none pointer-events-none group-hover:text-stone-200 transition-colors"
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <time className="text-xs text-stone-400 font-medium">
                      {s.date}
                    </time>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusClasses(
                        s.status
                      )}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusDotClass(
                          s.status
                        )}`}
                      ></span>
                      {s.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-sm text-stone-500 mt-2 leading-relaxed max-w-2xl">
                    {s.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t-2 border-stone-900 mb-14"></div>

        {/* Personal Notifications (auth-gated) */}
        {!isAuthed ? (
          /* Auth gate */
          <section className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-stone-400"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-stone-700 mb-2">
              Sign in to see your notifications
            </h3>
            <p className="text-sm text-stone-400 mb-6 max-w-sm mx-auto">
              Social activity, progress milestones, and path updates will appear
              here once you're signed in.
            </p>
            <Link
              to="/login"
              className="inline-block bg-stone-900 text-white hover:bg-stone-800 font-semibold text-sm px-8 py-2.5 transition-all hover:-translate-y-px"
            >
              Sign in
            </Link>
          </section>
        ) : (
          <>
            {/* Social */}
            <section className="mb-14">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 bg-violet-600 rounded-full"></div>
                  <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                    Social
                  </span>
                </div>
                <div className="flex-1 h-px bg-stone-200"></div>
              </div>
              <div className="rounded-md border border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
                <p className="text-sm text-stone-400">
                  Social and collaboration features coming soon.
                </p>
              </div>
            </section>

            {/* Progress */}
            <section className="mb-14">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 bg-cyan-600 rounded-full"></div>
                  <span className="text-sm font-black uppercase tracking-widest text-stone-900">
                    Progress
                  </span>
                </div>
                <div className="flex-1 h-px bg-stone-200"></div>
              </div>
              <div className="rounded-md border border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
                <p className="text-sm text-stone-400">
                  Progress tracking and milestone notifications coming soon.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
