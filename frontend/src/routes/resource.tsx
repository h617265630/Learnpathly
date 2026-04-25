import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { RouteLoader, DocumentTitle } from "./common";

const ResourceLibrary = lazy(() => import("@/modules/resource/pages/ResourceLibrary"));
const MyResource = lazy(() => import("@/modules/my-resource/pages/MyResource"));
const AddResource = lazy(() => import("@/modules/my-resource/pages/AddResource"));
const MyResourceEdit = lazy(() => import("@/modules/my-resource/pages/MyResourceEdit"));
const ResourceVideo = lazy(() => import("@/modules/my-resource/pages/ResourceVideo"));
const ResourceDocument = lazy(() => import("@/modules/my-resource/pages/ResourceDocument"));
const ResourceArticle = lazy(() => import("@/modules/my-resource/pages/ResourceArticle"));
const AddResourceToPath = lazy(() => import("@/modules/my-resource/pages/AddResourceToPath"));

export const resourceRoutes: RouteObject[] = [
  {
    path: "/resources",
    element: (
      <RouteLoader>
        <ResourceLibrary />
        <DocumentTitle
          seo={{
            title: "Resource Library - Learnpathly",
            description:
              "Browse curated learning resources including videos, documents, and articles. Find quality materials for any topic.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/my-resources",
    element: (
      <RouteLoader>
        <MyResource />
        <DocumentTitle
          seo={{
            title: "My Resources - Learnpathly",
            description: "Your saved and uploaded learning resources.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/my-resources/add",
    element: (
      <RouteLoader>
        <AddResource />
        <DocumentTitle
          seo={{
            title: "Add Resource - Learnpathly",
            description: "Add a new learning resource to your collection.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/my-resources/video/:id",
    element: (
      <RouteLoader>
        <ResourceVideo />
        <DocumentTitle
          seo={{
            title: "My Video Resource - Learnpathly",
            description: "Your saved video resource.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/my-resources/document/:id",
    element: (
      <RouteLoader>
        <ResourceDocument />
        <DocumentTitle
          seo={{
            title: "My Document Resource - Learnpathly",
            description: "Your saved document resource.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/my-resources/article/:id",
    element: (
      <RouteLoader>
        <ResourceArticle />
        <DocumentTitle
          seo={{
            title: "My Article Resource - Learnpathly",
            description: "Your saved article resource.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/my-resources/:id",
    element: <Navigate to="/my-resources/video/:id" replace />,
  },
  {
    path: "/my-resources/:id/edit",
    element: (
      <RouteLoader>
        <MyResourceEdit />
        <DocumentTitle
          seo={{
            title: "Edit Resource - Learnpathly",
            description: "Edit your learning resource.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/resources/video/:id",
    element: (
      <RouteLoader>
        <ResourceVideo />
        <DocumentTitle
          seo={{
            title: "Video Resource - Learnpathly",
            description: "Watch and learn from this video resource.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/resources/document/:id",
    element: (
      <RouteLoader>
        <ResourceDocument />
        <DocumentTitle
          seo={{
            title: "Document Resource - Learnpathly",
            description: "Read and learn from this document resource.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/resources/article/:id",
    element: (
      <RouteLoader>
        <ResourceArticle />
        <DocumentTitle
          seo={{
            title: "Article Resource - Learnpathly",
            description: "Read and learn from this article resource.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/resources/:type/:id/add-to-path",
    element: (
      <RouteLoader>
        <AddResourceToPath />
        <DocumentTitle
          seo={{
            title: "Add to Learning Path - Learnpathly",
            description: "Add this resource to one of your learning paths.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
];
