import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ── Request interceptor: attach token ──────────────────────────
api.interceptors.request.use((config) => {
  // Only attach token automatically if one isn't already set
  if (!config.headers.Authorization) {
    const url = config.url || "";
    if (url.includes("/admin/")) {
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
    } else {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401s ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const status = error.response?.status;

    if (status === 401) {
      const isAuthRoute =
        url.includes("/auth/login") ||
        url.includes("/auth/signup") ||
        url.includes("/admin/login");

      if (!isAuthRoute) {
        if (url.includes("/admin/")) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("admin");
          window.location.href = "/admin/login";
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;