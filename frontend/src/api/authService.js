import api from "./axiosInstance";

export const signupUser = async ({ name, email, password }) => {
  const response = await api.post("/auth/signup", { name, email, password });
  return response.data; // { success, message, data: { user, token } }
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data; // { success, message, data: { user, token } }
};

export const getProfile = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};