export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
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
