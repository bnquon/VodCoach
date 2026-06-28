import { api } from "./api";
import { toApiResult } from "./api-result";
import type { AuthResponse } from "./auth-storage";

export type AuthCredentials = {
  email: string;
  password: string;
};

export async function loginUser(credentials: AuthCredentials) {
  return toApiResult(
    api
      .post<AuthResponse>("/login", credentials)
      .then((response) => response.data),
  );
}

export async function registerUser(credentials: AuthCredentials) {
  return toApiResult(
    api
      .post<AuthResponse>("/register", credentials)
      .then((response) => response.data),
  );
}
