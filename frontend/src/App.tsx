import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar";
import { AppFooter } from "./components/layout/AppFooter";
import { useAuthStore } from "./stores/auth";
import { setAnalyticsUser } from "./utils/analytics";

const AUTH_PAGES = ["login", "register"];

function AppLayout() {
  const location = useLocation();
  const auth = useAuthStore();

  const isAuthPage = AUTH_PAGES.some((name) =>
    location.pathname.includes(name)
  );

  useEffect(() => {
    auth.fetchProfile().catch((error: unknown) => {
      console.warn("Failed to initialize user profile:", error);
    });
  }, []);

  useEffect(() => {
    if (auth.user) {
      setAnalyticsUser(auth.user);
    }
  }, [auth.user]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <NavBar />
      <main className="flex-1">
        {isAuthPage ? (
          <div className="px-4 py-6">
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <AppFooter />
    </div>
  );
}

export default AppLayout;
