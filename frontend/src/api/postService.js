import api from "./axiosInstance";

export const getFeed = (params = {}) => api.get("/posts", { params });
export const getPost = (id) => api.get(`/posts/${id}`);

export const createPost = (formData) =>
  api.post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const updatePost = (id, formData) =>
  api.put(`/posts/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

export const deletePost = (id) => api.delete(`/posts/${id}`);

export const likePost   = (id) => api.post(`/posts/${id}/like`);
export const unlikePost = (id) => api.post(`/posts/${id}/unlike`);

export const getComments   = (postId)       => api.get(`/posts/${postId}/comments`);
export const addComment    = (postId, data) => api.post(`/posts/${postId}/comments`, data);
export const updateComment = (commentId, data) => api.put(`/comments/${commentId}`, data);
export const deleteComment = (commentId)    => api.delete(`/comments/${commentId}`);