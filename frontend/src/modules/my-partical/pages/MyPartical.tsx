import { Outlet, Link, useLocation } from "react-router-dom";

function isActive(prefix: string, pathname: string) {
  return pathname.startsWith(prefix);
}

export default function MyPartical() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 -mt-4 md:-mt-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-none bg-white p-4 shadow-sm border border-stone-200">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-stone-900">
                My Partical
              </p>
              <p className="text-xs text-stone-500">我的素材与灵感</p>
            </div>

            <div className="mt-4 space-y-2">
              <Link
                to="/my-partical/home"
                className={`block rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive("/my-partical/home", location.pathname)
                    ? "bg-amber-500 text-white"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                Home
              </Link>
              <Link
                to="/my-partical/image"
                className={`block rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive("/my-partical/image", location.pathname)
                    ? "bg-amber-500 text-white"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                Image
              </Link>
              <Link
                to="/my-partical/flashed-ideas"
                className={`block rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive("/my-partical/flashed-ideas", location.pathname)
                    ? "bg-amber-500 text-white"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                Flashed Ideas
              </Link>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
