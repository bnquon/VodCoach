"use client";

import { useSyncExternalStore } from "react";
import {
  authStorageEvent,
  getAuthToken,
  getAuthUser,
  type AuthUser,
} from "./auth-storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(authStorageEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(authStorageEvent, callback);
  };
}

export function useAuthToken() {
  return useSyncExternalStore<string | null | undefined>(
    subscribe,
    getAuthToken,
    () => undefined,
  );
}

export function useAuthUser() {
  return useSyncExternalStore<AuthUser | null | undefined>(
    subscribe,
    getAuthUser,
    () => undefined,
  );
}
