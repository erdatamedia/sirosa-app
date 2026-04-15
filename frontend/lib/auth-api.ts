const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface AuthUser {
  id: string;
  name: string;
  email?: string | null;
  farmerId?: string | null;
  role: "ADMIN" | "FARMER";
  phone?: string | null;
  address?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterInput {
  name: string;
  phone?: string;
  address?: string;
  farmName?: string;
}

export interface RegisterResponse {
  token: string;
  user: AuthUser;
}

export interface LoginInput {
  identifier: string;
  password?: string;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : (data?.message ?? "Terjadi kesalahan");
    throw new Error(message);
  }
  return data as T;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMe(token: string): Promise<AuthUser> {
  return request("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateMe(
  token: string,
  input: { name?: string; email?: string; phone?: string; address?: string },
): Promise<AuthUser> {
  return request("/auth/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}

export async function changePassword(
  token: string,
  input: { oldPassword: string; newPassword: string },
): Promise<{ message: string }> {
  return request("/auth/change-password", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
}
