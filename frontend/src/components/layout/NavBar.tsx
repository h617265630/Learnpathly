import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, User, Plus, FileText, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../stores/auth";

const MAIN_NAV_LINKS = [
  { to: "/learningpool", label: "Pool" },
  { to: "/resources", label: "Resources" },
  { to: "/plan", label: "Plan" },
  { to: "/about", label: "About" },
  { to: "/updates", label: "Updates" },
];

const AI_DROPDOWN_LINKS = [
  { to: "/ai-path", label: "AI Path Generator", icon: Plus },
  { to: "/ai-resource", label: "AI Resource Search", icon: Plus },
];

const USER_DROPDOWN_LINKS = [
  { to: "/account", label: "Account", icon: User },
  { to: "/account/paths", label: "My Paths", icon: FileText },
  { to: "/account/resources", label: "My Resources", icon: FileText },
];

const CREATE_DROPDOWN_LINKS = [
  { to: "/createpath", label: "Create Path", icon: Plus },
  { to: "/ai-path", label: "AI Path", icon: Plus },
  { to: "/my-resources/add", label: "Add Resource", icon: Plus },
];

function isActivePath(prefix: string, pathname: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function NavBar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, isAuthed, logout } = useAuthStore();
  const isAdmin = user?.is_superuser === true;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);

  const userMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserMouseEnter = () => {
    if (userMenuTimeout.current) clearTimeout(userMenuTimeout.current);
    setUserMenuOpen(true);
  };
  const handleUserMouseLeave = () => {
    userMenuTimeout.current = setTimeout(() => setUserMenuOpen(false), 300);
  };

  const handleCreateMouseEnter = () => {
    if (createMenuTimeout.current) clearTimeout(createMenuTimeout.current);
    setCreateMenuOpen(true);
  };
  const handleCreateMouseLeave = () => {
    createMenuTimeout.current = setTimeout(() => setCreateMenuOpen(false), 300);
  };

  const handleAiMouseEnter = () => {
    if (aiMenuTimeout.current) clearTimeout(aiMenuTimeout.current);
    setAiMenuOpen(true);
  };
  const handleAiMouseLeave = () => {
    aiMenuTimeout.current = setTimeout(() => setAiMenuOpen(false), 300);
  };

  return (
    <header className="border-b border-stone-100 sticky top-0 bg-white z-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <img src="/favicon.png" alt="LearnPathly" className="h-7 w-7" />
            <span className="font-serif text-xl font-semibold tracking-tight text-stone-900">
              Learn<span className="text-sky-500">Pathly</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {MAIN_NAV_LINKS.map((link) => {
              const active = isActivePath(link.to, pathname);

              // Insert AI button before Plan
              if (link.to === "/plan") {
                return (
                  <div key="ai-nav-item" className="flex items-center gap-6">
                    <div
                      className="relative"
                      onMouseEnter={handleAiMouseEnter}
                      onMouseLeave={handleAiMouseLeave}
                    >
                      <button
                        type="button"
                        className="text-sm font-medium text-stone-500 hover:text-sky-600 transition-colors flex items-center gap-1"
                      >
                        AI
                        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${aiMenuOpen ? "rotate-180" : ""}`} />
                      </button>

                      {aiMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-50">
                          {AI_DROPDOWN_LINKS.map((link) => (
                            <Link
                              key={link.to}
                              to={link.to}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      key={link.to}
                      to={link.to}
                      className={`text-sm font-medium transition-colors ${active ? "text-sky-600" : "text-stone-500 hover:text-stone-700"}`}
                    >
                      {link.label}
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${active ? "text-sky-600" : "text-stone-500 hover:text-stone-700"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isAuthed ? (
              <>
                {/* User dropdown */}
                <div
                  className="relative h-full"
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-medium">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="hidden sm:inline">{user?.username || "Account"}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-50">
                      {[
                        ...USER_DROPDOWN_LINKS,
                        ...(isAdmin
                          ? [{ to: "/admin/dashboard", label: "Admin", icon: ShieldCheck }]
                          : []),
                      ].map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                      <hr className="my-1 border-stone-100" />
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="relative"
                  onMouseEnter={handleCreateMouseEnter}
                  onMouseLeave={handleCreateMouseLeave}
                >
                  <button
                    type="button"
                    className="bg-sky-500 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-1"
                  >
                    Create
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${createMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {createMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-50">
                      {CREATE_DROPDOWN_LINKS.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-sky-500 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
