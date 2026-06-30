import axios from "axios";
import { getShareSessionToken } from "./share-storage";

export function createShareApi(shareToken: string) {
  const shareApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  });

  shareApi.interceptors.request.use((config) => {
    const sessionToken = getShareSessionToken(shareToken);

    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }

    return config;
  });

  return shareApi;
}
