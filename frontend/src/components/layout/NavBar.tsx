import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, User, Plus, FileText } from "lucide-react";
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
];

function isActivePath(prefix: string, pathname: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function NavBar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, isAuthed, logout } = useAuthStore();
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
    <header className="border-b border-stone-300 sticky top-0 bg-white z-50 shadow-memphis">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3">
            <img src="/favicon.png" alt="LearnPathly" className="h-8 w-8" />
            <span className="font-serif text-2xl font-bold tracking-tight">
              Learn<span className="text-blue-400">Pathly</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {MAIN_NAV_LINKS.map((link, idx) => {
              const colors = ["#7c3aed", "#2563eb", "#16a34a", "#ca8a04", "#ea580c"];
              const color = colors[idx % colors.length];
              const active = isActivePath(link.to, pathname);

              // Insert AI button before Plan
              if (link.to === "/plan") {
                return (
                  <div key="ai-nav-item" className="flex items-center gap-8">
                    <div
                      className="relative"
                      onMouseEnter={handleAiMouseEnter}
                      onMouseLeave={handleAiMouseLeave}
                    >
                      <button
                        type="button"
                        className="bg-transparent text-pink-600 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:text-pink-500 transition-colors flex items-center gap-1"
                      >
                        AI
                        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${aiMenuOpen ? "rotate-180" : ""}`} />
                      </button>

                      {aiMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-48 bg-white border-2 border-black shadow-memphis py-1 z-50">
                          {AI_DROPDOWN_LINKS.map((link, idx) => {
                            const colors = ["#7c3aed", "#2563eb"];
                            const color = colors[idx % colors.length];
                            return (
                              <Link
                                key={link.to}
                                to={link.to}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors font-medium"
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                {link.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-sm font-bold uppercase tracking-wider px-3 py-1 transition-all hover:scale-105"
                      style={{
                        color: active ? color : "#78716c",
                      }}
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
                  className="text-sm font-bold uppercase tracking-wider px-3 py-1 transition-all hover:scale-105"
                  style={{
                    color: active ? color : "#78716c",
                  }}
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
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-700 hover:text-purple-500 transition-colors"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-black">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <span>{user?.username || "Account"}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black shadow-memphis py-1 z-50">
                      {USER_DROPDOWN_LINKS.map((link, idx) => {
                        const colors = ["#7c3aed", "#2563eb", "#16a34a", "#ca8a04"];
                        const color = colors[idx % colors.length];
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors font-medium"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {link.label}
                          </Link>
                        );
                      })}
                      <hr className="my-1 border-stone-100" />
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors font-medium"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500" />
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
                    className="bg-blue-500 text-white px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-blue-600 transition-colors shadow-memphis flex items-center gap-1"
                  >
                    Create
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${createMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {createMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border-2 border-black shadow-memphis py-1 z-50">
                      {CREATE_DROPDOWN_LINKS.map((link, idx) => {
                        const colors = ["#7c3aed", "#2563eb"];
                        const color = colors[idx % colors.length];
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors font-medium"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold uppercase tracking-wider text-stone-600 hover:text-purple-500 transition-colors px-3 py-1"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-blue-400 transition-colors duration-200 border-2 border-black shadow-memphis"
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