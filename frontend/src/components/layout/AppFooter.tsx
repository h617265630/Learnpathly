import { Link } from "react-router-dom";

const FOOTER_SECTIONS = [
  {
    title: "Learnpathly",
    links: [
      { label: "A personal learning platform. Build structured paths, track progress, and turn scattered resources into lasting knowledge.", href: "/about" },
    ],
    isDescription: true,
  },
  {
    title: "Platform",
    links: [
      { label: "LearningPool", href: "/learningpool" },
      { label: "Resources", href: "/resources" },
      { label: "Pricing", href: "/plan" },
      { label: "Updates", href: "/updates" },
    ],
  },
  {
    title: "Personal",
    links: [
      { label: "My Paths", href: "/account/paths" },
      { label: "My Resources", href: "/account/resources" },
      { label: "Creator Center", href: "/createpath" },
      { label: "Account", href: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How it works", href: "/about" },
      { label: "Learning Paths", href: "/learningpool" },
      { label: "Progress", href: "/account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function AppFooter() {
  return (
    <footer className="py-12 px-6 lg:px-12 border-t border-stone-200 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        {/* Footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900 mb-4">
                {section.title}
              </h3>
              {section.isDescription ? (
                <p className="text-sm text-stone-500 leading-relaxed">
                  {section.links[0].label}
                </p>
              ) : (
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-stone-200">
          <Link to="/home" className="flex items-center gap-2">
            <img src="/favicon.png" alt="LearnPathly" className="h-6 w-6" />
            <span className="font-serif text-lg font-bold">
              Learn<span className="text-blue-400">Pathly</span>
            </span>
          </Link>

          <p className="text-sm text-stone-400">
            © {new Date().getFullYear()} LearnPathly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}