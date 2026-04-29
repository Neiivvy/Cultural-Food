import api from "./axiosInstance";

// Own profile
export const getProfile    = (id) => api.get(`/users/${id}`);

// Update own profile (name, bio, profile_picture, is_public)
export const updateProfile = (id, formData) =>
  api.put(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Search public users by name/email
export const searchUsers = (q) =>
  api.get("/users/search", { params: { q } });

// Top engaging public users (for sidebar)
export const getTopUsers = () => api.get("/users/top");

// Approved food contributors (for sidebar)
export const getContributors = () => api.get("/users/contributors");

// Public profile of any user
export const getPublicProfile = (id) => api.get(`/users/${id}`);