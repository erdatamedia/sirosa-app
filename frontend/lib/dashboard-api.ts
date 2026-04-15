const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface TrendPoint {
  date: string;
  total: number;
}

export interface AdminDashboard {
  totalCows: number;
  totalFarms: number;
  totalFarmers: number;
  todayProduction: number;
  avgProductionPerCow: number;
  cowsRecordedToday: number;
  productionTrend: TrendPoint[];
  topCows: {
    earTag: string;
    name: string | null;
    farmName: string;
    avgProduction: number;
  }[];
  alertCows: {
    earTag: string;
    name: string | null;
    farmName: string;
    actual: number;
    predicted: number;
    percent: number;
  }[];
}

export interface FarmerDashboard {
  farmName: string | null;
  totalCows: number;
  totalActiveCows: number;
  todayProduction: number;
  avgProductionPerCow: number;
  cowsRecordedToday: number;
  productionTrend: TrendPoint[];
  topCows: { earTag: string; name: string | null; avgProduction: number }[];
  lowCows: { earTag: string; name: string | null; avgProduction: number }[];
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
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

export function getAdminDashboard(token: string): Promise<AdminDashboard> {
  return apiFetch("/dashboard/admin", token);
}

export function getFarmerDashboard(token: string): Promise<FarmerDashboard> {
  return apiFetch("/dashboard/farmer", token);
}
