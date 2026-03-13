import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// ── Attach the right token on every request ────────────────────
// Admin routes use adminToken; everything else uses the regular token
api.interceptors.request.use((config) => {
  const url = config.url || "";
  const isAdminRoute = url.includes("/admin/");

  const token = isAdminRoute
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("token");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-logout on 401 ─────────────────────────────────────────
// Skip redirect for login/signup endpoints so the component's
// catch block can display the error message instead
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";

    const isAuthRoute =
      url.includes("/auth/login")  ||
      url.includes("/auth/signup") ||
      url.includes("/admin/login");   // ← admin login must NOT auto-redirect

    if (err.response?.status === 401 && !isAuthRoute) {
      // Decide which session to clear based on which route failed
      if (url.includes("/admin/")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;