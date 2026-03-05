import api from "./axiosInstance";

export const getCultures = () => api.get("/cultures");