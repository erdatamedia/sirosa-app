const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export type MilkSession = "MORNING" | "AFTERNOON";

export interface MilkRecord {
  id: string;
  cowId: string;
  cow: { id: string; earTag: string; name: string | null };
  date: string;
  session: MilkSession;
  amount: number;
  userId: string;
  recordedBy: { id: string; name: string };
  createdAt: string;
}

export interface MilkSummary {
  todayTotal: number;
  avg7d: number;
  trend: { date: string; amount: number }[];
}

export interface MilkEvaluation {
  cow: { id: string; earTag: string; name: string | null };
  inputs: {
    parity: number;
    ll: number | null;
    bcs: number | null;
    weight: number | null;
  };
  predictionA: number | null;
  predictionB: number | null;
  actualAvg: number | null;
  selisihA: number | null;
  selisihB: number | null;
  percentA: number | null;
  percentB: number | null;
  status: "above" | "below" | "normal" | "insufficient_data";
}

export interface AdminStats {
  totalToday: number;
  cowsToday: number;
  avgPerCow: number;
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

export async function createMilkRecord(
  token: string,
  input: { cowId: string; date: string; session: MilkSession; amount: number },
): Promise<MilkRecord> {
  return req("/milk-production", { method: "POST", body: JSON.stringify(input) }, token);
}

export async function getMilkRecords(
  token: string,
  filters: { cowId?: string; from?: string; to?: string; limit?: number } = {},
): Promise<MilkRecord[]> {
  const p = new URLSearchParams();
  if (filters.cowId) p.set("cowId", filters.cowId);
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.limit) p.set("limit", String(filters.limit));
  const qs = p.toString() ? `?${p.toString()}` : "";
  return req(`/milk-production${qs}`, { method: "GET" }, token);
}

export async function getMilkSummary(
  token: string,
  cowId: string,
): Promise<MilkSummary> {
  return req(`/milk-production/summary?cowId=${cowId}`, { method: "GET" }, token);
}

export async function getMilkEvaluation(
  token: string,
  cowId: string,
): Promise<MilkEvaluation> {
  return req(`/milk-production/evaluate?cowId=${cowId}`, { method: "GET" }, token);
}

export async function deleteMilkRecord(token: string, id: string): Promise<void> {
  return req(`/milk-production/${id}`, { method: "DELETE" }, token);
}

export async function getAdminStats(
  token: string,
  farmId?: string,
): Promise<AdminStats> {
  const qs = farmId ? `?farmId=${farmId}` : "";
  return req(`/milk-production/admin/stats${qs}`, { method: "GET" }, token);
}

export async function getAdminTrend(
  token: string,
  farmId?: string,
): Promise<{ date: string; amount: number }[]> {
  const qs = farmId ? `?farmId=${farmId}` : "";
  return req(`/milk-production/admin/trend${qs}`, { method: "GET" }, token);
}
