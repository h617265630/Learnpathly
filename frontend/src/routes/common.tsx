import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
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
  const { isAuthed, user } = useAuthStore();
  const isAdmin = (user as { is_superuser?: boolean })?.is_superuser === true;

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
