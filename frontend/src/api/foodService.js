import api from "./axiosInstance";

// Public
export const getApprovedFoods = (params = {}) => api.get("/foods", { params });
export const getFoodById       = (id)          => api.get(`/foods/${id}`);

// Auth: submit new food (FormData with optional image)
export const submitFood = (formData) =>
  api.post("/foods", formData, { headers: { "Content-Type": "multipart/form-data" } });

// Admin
export const adminGetFoods    = (status = "")  => api.get(`/admin/foods${status ? `?status=${status}` : ""}`);
export const adminApproveFood = (id)           => api.put(`/admin/foods/${id}/approve`);
export const adminRejectFood  = (id, note="")  => api.put(`/admin/foods/${id}/reject`, { note });
export const adminDeleteFood  = (id)           => api.delete(`/admin/foods/${id}`);
export const adminGetStats    = ()             => api.get("/admin/stats");
export const adminGetReports  = ()             => api.get("/admin/reports");
export const adminActReport   = (id, action)   => api.put(`/admin/reports/${id}`, { action });
export const adminGetUsers    = ()             => api.get("/admin/users");
export const adminLogin       = (email, password) => api.post("/admin/login", { email, password });
export const adminGetMe       = ()             => api.get("/admin/me");