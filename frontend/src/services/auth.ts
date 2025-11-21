import { apiFetch } from "@/lib/api-client";

export type AuthPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
};

export async function register(payload: AuthPayload) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: AuthPayload) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchProfile(token: string) {
  return apiFetch<AuthResponse["user"]>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

