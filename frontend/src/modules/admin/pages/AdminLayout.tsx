import { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  BookOpen,
  BarChart3,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Resources", to: "/admin/resources", icon: FolderOpen },
  { label: "Learning Paths", to: "/admin/paths", icon: BookOpen },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
];

function isActive(prefix: string, pathname: string) {
  return pathname.startsWith(prefix);
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthed, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthed) {
      fetchProfile(true).catch(() => {});
    }
  }, [isAuthed, fetchProfile]);

  // Redirect to login if not authenticated, or to home if not admin
  useEffect(() => {
    if (!isAuthed) {
      navigate("/login");
      return;
    }
    if (user && !(user as { is_superuser?: boolean }).is_superuser) {
      navigate("/home");
    }
  }, [isAuthed, user, navigate]);

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (user && !(user as { is_superuser?: boolean }).is_superuser) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900">Access Denied</h1>
          <p className="text-stone-500 mt-2">
            You need admin privileges to access this page.
          </p>
          <Link
            to="/home"
            className="mt-4 inline-block text-amber-600 hover:underline"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Admin sidebar */}
      <aside className="w-64 shrink-0 bg-stone-900 p-5 flex flex-col">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-1">
            Admin
          </p>
          <h2 className="text-xl font-black text-white font-serif">
            Dashboard
          </h2>
        </div>

        <nav className="space-y-0.5 flex-1">
          {navItems.map((item) => {
            const active = isActive(item.to, location.pathname);
            const Icon = item.icon;
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
                <Icon className="w-4 h-4 shrink-0" />
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

        <div className="pt-4 border-t border-stone-700">
          <Link
            to="/home"
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-500 transition-colors"
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
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-stone-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
