import { Outlet, Link, useLocation } from "react-router-dom";

function isActive(prefix: string, pathname: string) {
  return pathname.startsWith(prefix);
}

export default function Partical() {
  const location = useLocation();

  const tabTitle = isActive("/partical/flashed-ideas", location.pathname)
    ? "Flashed Ideas"
    : "Image";
  const tabSubtitle = isActive("/partical/flashed-ideas", location.pathname)
    ? "记录灵感片段，快速归档。"
    : "收集图片素材，沉淀灵感来源。";

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 -mt-4 md:-mt-6">
      <section className="border-b border-stone-200 pb-4">
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
          <ol className="flex items-center gap-2">
            {[
              { label: "Home", to: "/home" },
              { label: "Partical", to: "/partical/image" },
              { label: tabTitle },
            ].map((item, idx, arr) => (
              <li
                key={`${idx}-${item.label}`}
                className="flex items-center gap-2"
              >
                {item.to && idx !== arr.length - 1 ? (
                  <Link to={item.to} className="hover:text-stone-900">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-stone-900 font-semibold">
                    {item.label}
                  </span>
                )}
                {idx !== arr.length - 1 && (
                  <span className="text-stone-400">/</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section>
        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-none border border-stone-200 bg-white p-4 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900">Partical</p>
                <p className="text-xs text-stone-500">素材收集与灵感记录</p>
              </div>

              <div className="mt-4 space-y-2">
                <Link
                  to="/partical/image"
                  className={`block rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive("/partical/image", location.pathname)
                      ? "bg-amber-500 text-white"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  Image
                </Link>
                <Link
                  to="/partical/flashed-ideas"
                  className={`block rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive("/partical/flashed-ideas", location.pathname)
                      ? "bg-amber-500 text-white"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  Flashed Ideas
                </Link>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-4">
            <div className="rounded-none border border-stone-200 bg-white p-6 shadow-sm">
              <Outlet />
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
