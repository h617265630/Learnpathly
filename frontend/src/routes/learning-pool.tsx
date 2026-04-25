import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { RouteLoader, DocumentTitle } from "./common";

const LearningPool = lazy(() => import("@/modules/learning-pool/pages/LearningPool"));
const LearningPoolCategory = lazy(() => import("@/modules/learning-pool/pages/LearningPoolCategory"));

export const learningPoolRoutes: RouteObject[] = [
  {
    path: "/learningpool",
    element: (
      <RouteLoader>
        <LearningPool />
        <DocumentTitle
          seo={{
            title: "Learning Pool - Learnpathly",
            description:
              "Explore public learning paths shared by the community. Find structured learning resources on any topic.",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/learningpool/category/:category",
    element: (
      <RouteLoader>
        <LearningPoolCategory />
        <DocumentTitle
          seo={{
            title: "Learning Pool - Learnpathly",
            description: "Browse learning paths by category.",
          }}
        />
      </RouteLoader>
    ),
  },
];
