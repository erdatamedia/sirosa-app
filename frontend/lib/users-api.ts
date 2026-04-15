const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface FarmerUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  farm: {
    id: string;
    name: string;
    address: string | null;
    cowCount: number;
    cows: { id: string; earTag: string; name: string | null; status: string }[];
  } | null;
}

export interface SystemInfo {
  version: string;
  totalUsers: number;
  totalCows: number;
  totalMilkRecords: number;
}

async function req<T>(
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
    const msg = Array.isArray(data?.message)
      ? data.message.join(", ")
      : (data?.message ?? "Terjadi kesalahan");
    throw new Error(msg);
  }
  return data as T;
}

export function getFarmers(token: string): Promise<FarmerUser[]> {
  return req("/users?role=FARMER", { method: "GET" }, token);
}

export function getSystemInfo(token: string): Promise<SystemInfo> {
  return req("/dashboard/system-info", { method: "GET" }, token);
}
