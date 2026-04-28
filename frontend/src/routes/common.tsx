import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "@/services/user";
import { useAuthStore } from "@/stores/auth";
import type { SeoMeta } from "@/stores/auth";

export interface RouteMeta {
  seo?: SeoMeta;
  requiresAdmin?: boolean;
}

export function RouteLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-stone-400">Loading...</div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function DocumentTitle({ seo }: { seo?: SeoMeta }) {
  if (seo?.title) {
    document.title = seo.title;
  }
  const description = document.querySelector('meta[name="description"]');
  if (description && seo?.description) {
    description.setAttribute("content", seo.description);
  }
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && seo?.title) {
    ogTitle.setAttribute("content", seo.title);
  }
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && seo?.description) {
    ogDesc.setAttribute("content", seo.description);
  }
  return null;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthed, user, setUser, logout } = useAuthStore();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking"
  );

  useEffect(() => {
    let cancelled = false;

    if (!isAuthed) {
      setStatus("denied");
      return () => {
        cancelled = true;
      };
    }

    setStatus("checking");
    getCurrentUser()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus(profile.is_superuser === true ? "allowed" : "denied");
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        setStatus("denied");
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthed, logout, setUser]);

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-stone-400">Checking admin access...</div>
      </div>
    );
  }

  const isAdmin = (user as { is_superuser?: boolean })?.is_superuser === true;

  if (status !== "allowed" || !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
