import api from "./axiosInstance";

// data = { title, description?, culture_id? }
export const getQuestions   = ()         => api.get("/questions");
export const createQuestion = (data)     => api.post("/questions", data);
export const deleteQuestion = (id)       => api.delete(`/questions/${id}`);
export const addAnswer      = (id, data) => api.post(`/questions/${id}/answers`, data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteAnswer   = (id)       => api.delete(`/answers/${id}`);