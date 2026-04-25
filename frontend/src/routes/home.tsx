import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { RouteLoader, DocumentTitle } from "./common";

const Home = lazy(() => import("@/modules/home/pages/Home"));
const Notification = lazy(() => import("@/modules/notification/pages/Notification"));
const Creator = lazy(() => import("@/modules/creator/pages/Creator"));
const Deck = lazy(() => import("@/modules/deck/pages/Deck"));
const AIPath = lazy(() => import("@/modules/ai-path/pages/AIPath"));
const AIPathDetail = lazy(() => import("@/modules/ai-path/pages/AIPathDetail"));

export const homeRoutes: RouteObject[] = [
  {
    path: "/home",
    element: (
      <RouteLoader>
        <Home />
        <DocumentTitle
          seo={{
            title: "Learnpathly - Discover, Learn, Grow",
            description:
              "Discover learning resources, build learning paths, and generate AI-guided study plans. Your personal learning companion.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/notification",
    element: (
      <RouteLoader>
        <Notification />
        <DocumentTitle
          seo={{
            title: "Notifications - Learnpathly",
            description: "Your learning notifications and updates.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/creator",
    element: (
      <RouteLoader>
        <Creator />
        <DocumentTitle
          seo={{
            title: "Content Creator - Learnpathly",
            description: "Create and share learning content on Learnpathly.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/deck",
    element: (
      <RouteLoader>
        <Deck />
        <DocumentTitle
          seo={{
            title: "Deck - Learnpathly",
            description: "Browse your flashcard decks for active recall learning.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/ai-path",
    element: (
      <RouteLoader>
        <AIPath />
        <DocumentTitle
          seo={{
            title: "AI Path Generator - Learnpathly",
            description:
              "Describe what you want to learn and get an AI-generated learning path with structured stages and curated resources.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/ai-path-detail",
    element: (
      <RouteLoader>
        <AIPathDetail />
        <DocumentTitle
          seo={{
            title: "AI Path Detail - Learnpathly",
            description: "Your personalized AI-generated learning path.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
];
