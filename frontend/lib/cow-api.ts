const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export type CowStatus = "ACTIVE" | "DRY" | "CULLED";

export interface Cow {
  id: string;
  earTag: string;
  name: string | null;
  birthDate: string | null;
  parity: number;
  currentWeight: number | null;
  currentBCS: number | null;
  lactationMonth: number | null;
  status: CowStatus;
  farmId: string;
  farm: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCowInput {
  earTag: string;
  name?: string;
  birthDate?: string;
  parity: number;
  currentWeight?: number;
  currentBCS?: number;
  lactationMonth?: number;
  status?: CowStatus;
  farmId?: string;
}

export interface UpdateCowInput {
  earTag?: string;
  name?: string;
  birthDate?: string;
  parity?: number;
  currentWeight?: number;
  currentBCS?: number;
  lactationMonth?: number;
  status?: CowStatus;
}

async function request<T>(
  path: string,
  options: RequestInit,
  token: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : (data?.message ?? "Terjadi kesalahan");
    throw new Error(message);
  }
  return data as T;
}

export async function getCows(
  token: string,
  filters: { farmId?: string; status?: string } = {},
): Promise<Cow[]> {
  const params = new URLSearchParams();
  if (filters.farmId) params.set("farmId", filters.farmId);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request(`/cows${qs}`, { method: "GET" }, token);
}

export async function getCow(token: string, id: string): Promise<Cow> {
  return request(`/cows/${id}`, { method: "GET" }, token);
}

export async function createCow(
  token: string,
  input: CreateCowInput,
): Promise<Cow> {
  return request(
    "/cows",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function updateCow(
  token: string,
  id: string,
  input: UpdateCowInput,
): Promise<Cow> {
  return request(
    `/cows/${id}`,
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export async function deleteCow(token: string, id: string): Promise<Cow> {
  return request(`/cows/${id}`, { method: "DELETE" }, token);
}
