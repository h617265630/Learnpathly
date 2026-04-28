import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ChunkLoadErrorBoundary } from "./components/ChunkLoadErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChunkLoadErrorBoundary>
      <RouterProvider router={router} />
    </ChunkLoadErrorBoundary>
  </StrictMode>
);
