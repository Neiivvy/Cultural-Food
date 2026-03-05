import api from "./axiosInstance";

// Feed — optional filters: culture_id, type, limit, offset
export const getFeed = (params = {}) =>
  api.get("/posts", { params });

// Single post with ingredients + steps
export const getPost = (id) => api.get(`/posts/${id}`);

// Create — sends FormData (media file + JSON fields)
export const createPost = (formData) =>
  api.post("/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Update
export const updatePost = (id, formData) =>
  api.put(`/posts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Delete
export const deletePost = (id) => api.delete(`/posts/${id}`);

// Likes
export const likePost   = (id) => api.post(`/posts/${id}/like`);
export const unlikePost = (id) => api.post(`/posts/${id}/unlike`);

// Comments
export const getComments = (postId) => api.get(`/posts/${postId}/comments`);
export const addComment  = (postId, data) => api.post(`/posts/${postId}/comments`, data);
export const updateComment = (commentId, data) => api.put(`/comments/${commentId}`, data);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);