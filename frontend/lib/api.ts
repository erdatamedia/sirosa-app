const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export type PredictionModel = "A" | "B";

export interface PredictRequest {
  model: PredictionModel;
  ll: number;
  bcs: number;
  parity?: number;
  weight?: number;
}

export interface PredictResponse {
  model: PredictionModel;
  result: number;
  unit: string;
  inputs: {
    parity?: number;
    ll: number;
    bcs: number;
    weight?: number;
  };
}

export interface PredictionHistory {
  id: number;
  model: string;
  parity: number | null;
  ll: number;
  bcs: number;
  weight: number | null;
  result: number;
  createdAt: string;
}

export async function predict(data: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${API_URL}/prediction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Terjadi kesalahan pada server");
  }

  return res.json();
}

export async function getHistory(limit = 10): Promise<PredictionHistory[]> {
  const res = await fetch(`${API_URL}/prediction/history?limit=${limit}`);
  if (!res.ok) throw new Error("Gagal memuat riwayat");
  return res.json();
}
