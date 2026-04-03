import { Link } from 'react-router-dom'

const PLATFORM_LINKS = [
  { to: '/learningpool', label: 'LearningPool' },
  { to: '/resources', label: 'Resources' },
  { to: '/plan', label: 'Pricing' },
  { to: '/notification', label: 'Updates' },
]

const PERSONAL_LINKS = [
  { to: '/my-paths', label: 'My Paths' },
  { to: '/my-resources', label: 'My Resources' },
  { to: '/creator', label: 'Creator Center' },
  { to: '/account', label: 'Account' },
]

const COMPANY_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/about/resources', label: 'How it works' },
  { to: '/about/learning-paths', label: 'Learning Paths' },
  { to: '/about/progress', label: 'Progress' },
]

const LEGAL_LINKS = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
]

export function AppFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        {/* Top: brand + links grid */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-12 md:col-span-4">
            <Link to="/home" className="flex items-center gap-2.5 group mb-4">
              <img src="/favicon.svg" alt="Learnpathly" className="h-8 w-8 rounded-none" />
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Learnpathly
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              A personal learning platform. Build structured paths, track progress, and turn scattered resources into lasting knowledge.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
                className="text-slate-300 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div className="col-span-6 md:col-span-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Platform</h3>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Personal</h3>
            <ul className="space-y-2.5">
              {PERSONAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Company</h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Learnpathly. Built with intention.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
