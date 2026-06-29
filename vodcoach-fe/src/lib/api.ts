import axios from "axios";
import { clearAuth, getAuthToken, isAuthTokenExpired } from "./auth-storage";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token && isAuthTokenExpired(token)) {
    clearAuth();
    return config;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
