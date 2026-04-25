import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { RouteLoader, DocumentTitle, AdminGuard } from "./common";

const AdminLayout = lazy(() => import("@/modules/admin/pages/AdminLayout"));
const AdminDashboard = lazy(() => import("@/modules/admin/pages/Dashboard"));
const AdminUserManagement = lazy(() => import("@/modules/admin/pages/UserManagement"));
const AdminResourceManagement = lazy(() => import("@/modules/admin/pages/ResourceManagement"));
const AdminLearningPathManagement = lazy(() => import("@/modules/admin/pages/LearningPathManagement"));
const AdminAnalytics = lazy(() => import("@/modules/admin/pages/Analytics"));

export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <RouteLoader>
          <AdminLayout />
          <DocumentTitle
            seo={{
              title: "Admin - Learnpathly",
              description: "Admin dashboard.",
              noindex: true,
            }}
          />
        </RouteLoader>
      </AdminGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <RouteLoader>
            <AdminDashboard />
            <DocumentTitle
              seo={{
                title: "Dashboard - Admin - Learnpathly",
                description: "Admin dashboard overview.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "users",
        element: (
          <RouteLoader>
            <AdminUserManagement />
            <DocumentTitle
              seo={{
                title: "User Management - Admin - Learnpathly",
                description: "Manage platform users.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "resources",
        element: (
          <RouteLoader>
            <AdminResourceManagement />
            <DocumentTitle
              seo={{
                title: "Resource Management - Admin - Learnpathly",
                description: "Manage platform resources.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "paths",
        element: (
          <RouteLoader>
            <AdminLearningPathManagement />
            <DocumentTitle
              seo={{
                title: "Path Management - Admin - Learnpathly",
                description: "Manage learning paths.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "analytics",
        element: (
          <RouteLoader>
            <AdminAnalytics />
            <DocumentTitle
              seo={{
                title: "Analytics - Admin - Learnpathly",
                description: "Platform analytics and insights.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
    ],
  },
];
