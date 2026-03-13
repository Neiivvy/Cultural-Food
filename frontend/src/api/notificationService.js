import api from "./axiosInstance";

export const getNotifications = () => api.get("/notifications");
export const markAllRead      = () => api.put("/notifications/read");