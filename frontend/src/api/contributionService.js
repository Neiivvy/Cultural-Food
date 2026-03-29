import api from "./axiosInstance.js";

// User: submit a new contribution (FormData for image upload)
export const submitContribution = (formData) =>
  api.post("/contributions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// User: get their own contributions
export const getMyContributions = () => api.get("/contributions/mine");

// Admin: get all contributions, optionally filtered by status
// axiosInstance interceptor automatically attaches adminToken for /admin/ routes
// but /contributions is not under /admin/ — so we attach it manually here
export const getAdminContributions = (status = "") => {
  const token = localStorage.getItem("adminToken");
  return api.get(`/contributions${status ? `?status=${status}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Admin: get one contribution detail
export const getAdminContributionById = (id) => {
  const token = localStorage.getItem("adminToken");
  return api.get(`/contributions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Admin: update contribution fields
export const updateContribution = (id, formData) => {
  const token = localStorage.getItem("adminToken");
  return api.put(`/contributions/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};

// Admin: approve
export const approveContribution = (id, adminMessage = "") => {
  const token = localStorage.getItem("adminToken");
  return api.post(`/contributions/${id}/approve`, { adminMessage }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Admin: reject
export const rejectContribution = (id, adminMessage) => {
  const token = localStorage.getItem("adminToken");
  return api.post(`/contributions/${id}/reject`, { adminMessage }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};