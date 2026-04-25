import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

const navItems = [
  { label: "My Resources", to: "/account/my-resources" },
  { label: "My Paths", to: "/account/my-paths" },
  { label: "User Info", to: "/account/user-info" },
  { label: "Plan", to: "/account/plan" },
  { label: "Change Password", to: "/account/change-password" },
];

function isActive(path: string, pathname: string) {
  return pathname.startsWith(path);
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function Account() {
  const location = useLocation();
  const { user, isAuthed, fetchProfile, avatarBuster } = useAuthStore();

  useEffect(() => {
    if (isAuthed) {
      fetchProfile(true).catch(() => {});
    }
  }, [isAuthed, fetchProfile]);

  const displayName = (user as any)?.display_name || user?.username || "User";
  const email = user?.email || "";
  const avatarUrl = (user as any)?.avatar_url;
  const avatarSrc = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarBuster}`
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Editorial header */}
      <div className="mb-8 pb-6 border-b border-stone-200">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
              Account
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 font-serif leading-tight">
              Your Account.
            </h1>
          </div>
          <Link
            to="/home"
            className="hidden md:flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span>Back to home</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sidebar: editorial nav */}
        <aside className="lg:col-span-3">
          {/* User profile card */}
          <div className="mb-5 p-5 bg-stone-900 rounded-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 shrink-0 overflow-hidden rounded-none border-2 border-amber-500/30">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-none object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-amber-500 text-white text-sm font-bold">
                    {getInitials(displayName)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-stone-400 truncate">{email}</p>
              </div>
            </div>
            <div className="w-8 h-px bg-amber-500/40 mb-4" />
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const active = isActive(item.to, location.pathname);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-all duration-150 group ${
                      active
                        ? "bg-amber-500 text-stone-900"
                        : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                        active
                          ? "bg-stone-900"
                          : "bg-stone-600 group-hover:bg-stone-400"
                      }`}
                    />
                    {item.label}
                    {active && (
                      <span className="ml-auto">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-stone-700"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Back link */}
          <Link
            to="/home"
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-500 transition-colors px-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to home
          </Link>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
