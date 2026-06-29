export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

type JwtPayload = {
  exp?: number;
};

const authTokenKey = "vodcoach.auth.token";
const authUserKey = "vodcoach.auth.user";
export const authStorageEvent = "vodcoach.auth.changed";

let cachedUserString: string | null = null;
let cachedUser: AuthUser | null = null;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAuthToken() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(authTokenKey);
}

export function isAuthTokenExpired(token: string) {
  const payload = parseJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

export function getAuthUser() {
  if (!canUseStorage()) {
    return null;
  }

  const storedUser = window.localStorage.getItem(authUserKey);
  if (!storedUser) {
    cachedUserString = null;
    cachedUser = null;
    return null;
  }

  if (storedUser === cachedUserString) {
    return cachedUser;
  }

  try {
    cachedUserString = storedUser;
    cachedUser = JSON.parse(storedUser) as AuthUser;
    return cachedUser;
  } catch {
    cachedUserString = null;
    cachedUser = null;
    clearAuth();
    return null;
  }
}

export function saveAuth(auth: AuthResponse) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(authTokenKey, auth.token);
  window.localStorage.setItem(authUserKey, JSON.stringify(auth.user));
  cachedUserString = JSON.stringify(auth.user);
  cachedUser = auth.user;
  window.dispatchEvent(new Event(authStorageEvent));
}

export function clearAuth() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(authTokenKey);
  window.localStorage.removeItem(authUserKey);
  cachedUserString = null;
  cachedUser = null;
  window.dispatchEvent(new Event(authStorageEvent));
}

function parseJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = padBase64(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
    );
    const decodedPayload = window.atob(normalizedPayload);

    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function padBase64(value: string) {
  const paddingLength = (4 - (value.length % 4)) % 4;

  return value + "=".repeat(paddingLength);
}
