import axios, { isAxiosError } from "axios";
import { getShareSessionToken } from "./share-storage";

export const SHARE_SESSION_EXPIRED_EVENT = "vodcoach-share-session-expired";

export type ShareSessionExpiredEvent = CustomEvent<{
  shareToken: string;
}>;

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

  shareApi.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        typeof window !== "undefined" &&
        isAxiosError(error) &&
        error.response?.status === 401
      ) {
        window.dispatchEvent(
          new CustomEvent(SHARE_SESSION_EXPIRED_EVENT, {
            detail: { shareToken },
          }),
        );
      }

      return Promise.reject(error);
    },
  );

  return shareApi;
}
