import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { RouteLoader, DocumentTitle } from "./common";

const MyLearningPath = lazy(() => import("@/modules/my-path/pages/MyLearningPath"));
const CreatePath = lazy(() => import("@/modules/learning-path/pages/CreatePath"));
const LearningPathDetail = lazy(() => import("@/modules/learning-path/pages/LearningPathDetail"));
const LearningPathLinear = lazy(() => import("@/modules/learning-path/pages/LearningPathLinear"));
const LearningPathEdit = lazy(() => import("@/modules/learning-path/pages/LearningPathEdit"));

export const learningPathRoutes: RouteObject[] = [
  {
    path: "/my-paths",
    element: (
      <RouteLoader>
        <MyLearningPath />
        <DocumentTitle
          seo={{
            title: "My Learning Paths - Learnpathly",
            description: "Your personal learning paths.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/createpath",
    element: (
      <RouteLoader>
        <CreatePath />
        <DocumentTitle
          seo={{
            title: "Create Learning Path - Learnpathly",
            description: "Create a new learning path to organize your studies.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/learningpath-detail",
    element: <Navigate to="/learningpool" replace />,
  },
  {
    path: "/learningpath-pool",
    element: <Navigate to="/learningpool" replace />,
  },
  {
    path: "/learningpath/:id/edit",
    element: (
      <RouteLoader>
        <LearningPathEdit />
        <DocumentTitle
          seo={{
            title: "Edit Learning Path - Learnpathly",
            description: "Edit your learning path.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/learningpath/:id/detail",
    element: (
      <RouteLoader>
        <LearningPathDetail />
        <DocumentTitle
          seo={{
            title: "Learning Path - Learnpathly",
            description: "View this learning path.",
            type: "article",
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/learningpath/:id/linear",
    element: (
      <RouteLoader>
        <LearningPathLinear />
        <DocumentTitle
          seo={{
            title: "Learning Path (Linear View) - Learnpathly",
            description: "View this learning path in linear format.",
            noindex: true,
          }}
        />
      </RouteLoader>
    ),
  },
  {
    path: "/learningpath/:id",
    element: (
      <RouteLoader>
        <LearningPathDetail />
        <DocumentTitle
          seo={{
            title: "Learning Path - Learnpathly",
            description: "View this learning path.",
            type: "article",
          }}
        />
      </RouteLoader>
    ),
  },
];
