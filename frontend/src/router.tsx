import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./App";
import {
  homeRoutes,
  learningPoolRoutes,
  learningPathRoutes,
  resourceRoutes,
  authRoutes,
  adminRoutes,
  particialRoutes,
  miscRoutes,
} from "./routes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      ...homeRoutes,
      ...learningPoolRoutes,
      ...learningPathRoutes,
      ...resourceRoutes,
      ...authRoutes,
      ...adminRoutes,
      ...particialRoutes,
      ...miscRoutes,
    ],
  },
]);

export default router;
