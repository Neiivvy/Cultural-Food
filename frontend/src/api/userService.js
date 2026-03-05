import api from "./axiosInstance";

export const getProfile    = (id) => api.get(`/users/${id}`);

// formData may contain: name, bio, profile_picture (File)
export const updateProfile = (id, formData) =>
  api.put(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });