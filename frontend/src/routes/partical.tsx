import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { RouteLoader, DocumentTitle } from "./common";

const Partical = lazy(() => import("@/modules/partical/pages/Partical"));
const ParticalImage = lazy(() => import("@/modules/partical/pages/ParticalImage"));
const ParticalFlashedIdeas = lazy(() => import("@/modules/partical/pages/ParticalFlashedIdeas"));
const MyPartical = lazy(() => import("@/modules/my-partical/pages/MyPartical"));
const MyParticalHome = lazy(() => import("@/modules/my-partical/pages/MyParticalHome"));

export const particialRoutes: RouteObject[] = [
  {
    path: "/partical",
    element: (
      <RouteLoader>
        <Partical />
        <DocumentTitle
          seo={{
            title: "Partical - Learnpathly",
            description: "Create flashcards from your learning materials.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
    children: [
      { index: true, element: <Navigate to="/partical/image" replace /> },
      {
        path: "image",
        element: (
          <RouteLoader>
            <ParticalImage />
            <DocumentTitle
              seo={{
                title: "Image Flashcards - Learnpathly",
                description: "Create flashcards from images.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "flashed-ideas",
        element: (
          <RouteLoader>
            <ParticalFlashedIdeas />
            <DocumentTitle
              seo={{
                title: "Flashed Ideas - Learnpathly",
                description: "Quick flashcards for active recall.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
    ],
  },
  {
    path: "/my-partical",
    element: (
      <RouteLoader>
        <MyPartical />
        <DocumentTitle
          seo={{
            title: "My Flashcards - Learnpathly",
            description: "Your flashcard decks for active recall learning.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
    children: [
      { index: true, element: <Navigate to="/my-partical/home" replace /> },
      {
        path: "home",
        element: (
          <RouteLoader>
            <MyParticalHome />
            <DocumentTitle
              seo={{
                title: "My Flashcards - Learnpathly",
                description: "Your flashcard decks.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "image",
        element: (
          <RouteLoader>
            <ParticalImage />
            <DocumentTitle
              seo={{
                title: "My Image Flashcards - Learnpathly",
                description: "Your image-based flashcards.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
      {
        path: "flashed-ideas",
        element: (
          <RouteLoader>
            <ParticalFlashedIdeas />
            <DocumentTitle
              seo={{
                title: "My Flashed Ideas - Learnpathly",
                description: "Your quick recall flashcards.",
                noindex: true,
              }}
            />
          </RouteLoader>
        ),
      },
    ],
  },
];
