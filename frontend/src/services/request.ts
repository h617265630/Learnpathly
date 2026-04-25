import axios from "axios";
import type { AxiosInstance } from "axios";

// Read token at runtime only; avoids importing pinia/DOM types that may break builds.
function getToken() {
  try {
    const local = (globalThis as any).localStorage;
    const session = (globalThis as any).sessionStorage;
    return (
      local?.getItem("learnsmart_token") ||
      session?.getItem("learnsmart_token") ||
      ""
    );
  } catch {
    return "";
  }
}

function clearAuth() {
  try {
    const local = (globalThis as any).localStorage;
    const session = (globalThis as any).sessionStorage;
    local?.removeItem?.("learnsmart_token");
    local?.removeItem?.("learnsmart_user");
    local?.removeItem?.("learnsmart_remember");
    session?.removeItem?.("learnsmart_token");
    session?.removeItem?.("learnsmart_user");
  } catch {
    // ignore storage errors
  }
}

function redirectToLogin() {
  try {
    // Hard navigation is the most robust (no router import / circular deps)
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname || "";
      if (currentPath !== "/login") {
        window.location.href = "/login";
      }
    }
  } catch {
    // ignore
  }
}

const request: AxiosInstance = axios.create({
  // FastAPI base URL
  // - Dev: fallback to localhost
  // - Prod: fallback to api.learnpathly.com to avoid accidentally shipping localhost
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD
      ? "https://api.learnpathly.com"
      : "http://localhost:8000"),
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  // Set JSON content-type only when sending plain objects (not FormData)
  const headers = config.headers || {};
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isFormData) {
    if (!headers["Content-Type"] && !headers["content-type"]) {
      (headers as any)["Content-Type"] = "application/json";
    }
  }

  const token = getToken();
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }
  config.headers = headers;
  return config;
});

request.interceptors.response.use(
  (response) => {
    console.log(`Response: ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error) => {
    if (error.response) {
      console.error("Request error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Auth errors (expired/invalid token)
      const status = Number(error.response.status);
      const detail = (error.response.data as any)?.detail;
      const url = String(error?.config?.url || "");
      const isAuthRoute =
        url.includes("/users/login") || url.includes("/users/register");
      // Public endpoints - don't redirect on 401, just reject the error
      const isPublicRoute =
        (url.includes("/resources") && !url.includes("/resources/me")) ||
        url.includes("/categories") ||
        url.includes("/learning-paths/public") ||
        url.includes("/learning-paths/");
      const isTokenExpired =
        typeof detail === "string" && /token has expired/i.test(detail);
      const isUnauthorized = status === 401;
      if (!isAuthRoute && !isPublicRoute && isUnauthorized) {
        // clear local auth state so UI doesn't think we're logged in
        clearAuth();
        if (isTokenExpired) {
          console.warn("Token expired. Redirecting to login.");
        }
        redirectToLogin();
      }

      // CORS-related errors
      if (
        error.message.includes("CORS") ||
        error.message.includes("Access-Control")
      ) {
        console.error("CORS error! Please check the backend configuration.");
      }
    } else if (error.request) {
      console.error("No response:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default request;
