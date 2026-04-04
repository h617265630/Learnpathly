import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Library, Plus, Search, User, ChevronDown, LogOut, Globe, Menu, X, PenLine,
  LayoutDashboard, BookOpen, Settings, CreditCard,
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth'
import { cn } from '../../utils/cn'

interface Language {
  code: string
  label: string
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
]

interface NavLink {
  to: string
  label: string
}

interface MenuItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const MAIN_NAV_LINKS: NavLink[] = [
  { to: '/learningpool', label: 'Pool' },
  { to: '/resources', label: 'Resources' },
  { to: '/ai-path', label: 'AI Path' },
  { to: '/plan', label: 'Plan' },
  { to: '/about', label: 'About' },
  { to: '/notification', label: 'Updates' },
]

const CREATE_MENU_ITEMS: MenuItem[] = [
  { to: '/createpath', label: 'New learning path', icon: Plus },
  { to: '/my-resources/add', label: 'Add resource', icon: Library },
  { to: '/creator?tab=markdown', label: 'Write a note', icon: PenLine },
]

const USER_MENU_ITEMS: MenuItem[] = [
  { to: '/account/user-info', label: 'Account', icon: User },
  { to: '/my-paths', label: 'My Paths', icon: LayoutDashboard },
  { to: '/my-resources', label: 'My Resources', icon: BookOpen },
  { to: '/account/plan', label: 'Plan & Billing', icon: CreditCard },
  { to: '/account', label: 'Settings', icon: Settings },
]

function isActivePath(prefix: string, pathname: string) {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

export function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthed, logout } = useAuthStore()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentLang, setCurrentLang] = useState('EN')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const desktopMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pathname = location.pathname

  const displayName = user?.username || 'User'
  const userInitials = displayName.slice(0, 2).toUpperCase()
  const userEmail = user?.email || ''

  const handleLogout = useCallback(() => {
    logout()
    setDesktopMenuOpen(false)
    setMobileMenuOpen(false)
    navigate('/home')
  }, [logout, navigate])

  const openDesktopMenu = useCallback(() => {
    if (desktopMenuTimerRef.current) {
      clearTimeout(desktopMenuTimerRef.current)
      desktopMenuTimerRef.current = null
    }
    setDesktopMenuOpen(true)
  }, [])

  const scheduleDesktopMenuClose = useCallback(() => {
    desktopMenuTimerRef.current = setTimeout(() => {
      setDesktopMenuOpen(false)
      desktopMenuTimerRef.current = null
    }, 180)
  }, [])

  const closeDesktopMenu = useCallback(() => {
    if (desktopMenuTimerRef.current) {
      clearTimeout(desktopMenuTimerRef.current)
      desktopMenuTimerRef.current = null
    }
    setDesktopMenuOpen(false)
  }, [])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setSearchQuery('')
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [])

  const submitSearch = useCallback(() => {
    const q = searchQuery.trim()
    closeSearch()
    if (q) {
      navigate({ pathname: '/learningpool', search: `search=${encodeURIComponent(q)}` })
    } else {
      navigate('/learningpool')
    }
  }, [searchQuery, closeSearch, navigate])

  const selectLang = useCallback((code: string) => {
    const lang = LANGUAGES.find(l => l.code === code)
    if (lang) setCurrentLang(lang.label)
    setLangMenuOpen(false)
  }, [])

  useEffect(() => {
    return () => {
      if (desktopMenuTimerRef.current) {
        clearTimeout(desktopMenuTimerRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Topbar: slim utility bar */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="hidden md:inline">Learn structured, learn better.</span>
            <span className="hidden md:inline text-slate-200">·</span>
            <a
              href="https://github.com/h617265630/contrail-react"
              target="_blank"
              rel="noopener"
              className="hover:text-slate-600 transition-colors"
              aria-label="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-3">
            {/* Language selector */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-slate-100 bg-white shadow-lg z-50 py-1">
                  {LANGUAGES.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors',
                        currentLang === opt.label ? 'bg-slate-50 text-slate-900 font-semibold' : ''
                      )}
                      onClick={() => selectLang(opt.code)}
                    >
                      <span>{opt.label}</span>
                      {currentLang === opt.label && <span className="text-blue-500">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header className="sticky top-0 z-40 bg-stone-50 backdrop-blur-md border-b border-stone-100">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-16 flex items-center justify-between gap-8">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-3 shrink-0 group">
              <img src="/favicon.svg" alt="Learnpathly" className="h-10 w-10 rounded-sm shadow-sm" />
              <div className="flex flex-col leading-none">
                <span className="text-base font-black tracking-tight text-stone-900 group-hover:text-blue-600 transition-colors">
                  Learnpathly
                </span>
                <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase mt-0.5">Learning Platform</span>
              </div>
            </Link>

            {/* Primary nav: desktop */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {MAIN_NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'relative px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors duration-150 group',
                    isActivePath(link.to, pathname) ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      'absolute bottom-0 left-3 right-3 h-px bg-blue-500 transition-all duration-300 origin-left',
                      isActivePath(link.to, pathname) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search icon - visible on all screens */}
              {searchOpen ? (
                <div className="flex items-center gap-2 h-9 rounded-full border border-slate-200 bg-white pl-3 pr-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder="Search..."
                    aria-label="Search"
                    className="w-24 sm:w-40 h-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitSearch()
                      if (e.key === 'Escape') closeSearch()
                    }}
                  />
                  <button
                    type="button"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Close search"
                    onClick={closeSearch}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all"
                  aria-label="Search"
                  onClick={openSearch}
                >
                  <Search className="w-4 h-4" />
                </button>
              )}

              {/* Auth: logged in - desktop */}
              {isAuthed && (
                <div
                  className="relative hidden md:block"
                  onMouseEnter={openDesktopMenu}
                  onMouseLeave={scheduleDesktopMenuClose}
                >
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 hover:border-slate-300 hover:bg-slate-50 transition-all"
                    aria-expanded={desktopMenuOpen}
                    aria-haspopup="menu"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') closeDesktopMenu()
                    }}
                  >
                    <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        userInitials
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 hidden lg:inline">{displayName}</span>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', desktopMenuOpen ? 'rotate-180' : '')} />
                  </button>

                  {/* Dropdown menu */}
                  {desktopMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-56 rounded-md border border-slate-100 bg-white shadow-xl z-50 py-1"
                      onMouseEnter={openDesktopMenu}
                      onMouseLeave={scheduleDesktopMenuClose}
                    >
                      <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{userEmail}</p>
                      </div>
                      <div className="py-1">
                        {USER_MENU_ITEMS.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            role="menuitem"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            onClick={() => setDesktopMenuOpen(false)}
                          >
                            <item.icon className="w-4 h-4 text-slate-400" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-slate-50 mt-1 pt-1 pb-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          role="menuitem"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auth: logged in - mobile avatar */}
              {isAuthed && (
                <button
                  type="button"
                  className="md:hidden flex items-center justify-center h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-white"
                  aria-label="Account menu"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>
                </button>
              )}

              {/* Auth: logged out */}
              {!isAuthed && (
                <>
                  <Link
                    to="/login"
                    className="hidden md:inline-flex h-9 rounded-full px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all items-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="hidden md:inline-flex h-9 rounded-full bg-slate-900 text-white hover:bg-slate-800 px-5 text-xs font-semibold shadow-sm transition-all hover:-translate-y-px items-center"
                  >
                    Get started
                  </Link>
                </>
              )}

              {/* CREATE button: desktop only */}
              <div className="relative hidden md:inline-flex">
                <button
                  type="button"
                  className="h-9 rounded-full bg-blue-500 text-white hover:bg-blue-600 px-4 text-xs font-semibold shadow-sm transition-all hover:-translate-y-px"
                  onClick={() => setCreateMenuOpen(!createMenuOpen)}
                >
                  + Create
                </button>
                {createMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-slate-100 bg-white shadow-xl z-50 py-1">
                    {CREATE_MENU_ITEMS.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        onClick={() => setCreateMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4 text-slate-400" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                type="button"
                className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
              <div className="pt-3 mt-3">
                {MAIN_NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors',
                      isActivePath(link.to, pathname)
                        ? 'bg-slate-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 mt-3">
                {CREATE_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {!isAuthed && (
                <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
