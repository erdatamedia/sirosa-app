"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { type Cow, getCows } from "@/lib/cow-api";
import {
  type MilkSession,
  type MilkRecord,
  type MilkEvaluation,
  createMilkRecord,
  getMilkRecords,
  getMilkEvaluation,
} from "@/lib/milk-api";

// ─── Helpers ────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function groupByDate(records: MilkRecord[]) {
  const map = new Map<string, MilkRecord[]>();
  for (const r of records) {
    const key = r.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

// ─── Evaluation card ─────────────────────────────────────────────────────────
function EvalCard({ ev }: { ev: MilkEvaluation }) {
  const statusIcon =
    ev.status === "above" ? (
      <TrendingUp size={16} className="text-green-600" />
    ) : ev.status === "below" ? (
      <TrendingDown size={16} className="text-red-500" />
    ) : ev.status === "normal" ? (
      <Minus size={16} className="text-yellow-500" />
    ) : null;

  const statusText =
    ev.status === "above"
      ? "Di atas prediksi"
      : ev.status === "below"
        ? "Di bawah prediksi"
        : ev.status === "normal"
          ? "Sesuai prediksi"
          : "Data belum cukup";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 space-y-3 mt-3"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#16a34a] flex items-center justify-center">
          <Check size={13} className="text-white" strokeWidth={3} />
        </div>
        <span className="text-sm font-semibold text-[#15803d]">
          Data berhasil disimpan
        </span>
      </div>

      <div className="border-t border-[#bbf7d0] pt-3">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          Evaluasi Prediksi vs Aktual
        </p>
        <div className="space-y-1.5 text-sm">
          {ev.predictionA !== null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Prediksi Model A</span>
              <span className="font-semibold text-gray-800">
                {ev.predictionA.toFixed(2)} L
              </span>
            </div>
          )}
          {ev.predictionB !== null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Prediksi Model B</span>
              <span className="font-semibold text-gray-800">
                {ev.predictionB.toFixed(2)} L
              </span>
            </div>
          )}
          {ev.actualAvg !== null ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Aktual rata-rata 7 hari</span>
              <span className="font-semibold text-gray-800">
                {ev.actualAvg.toFixed(2)} L
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              Belum ada data aktual untuk perbandingan.
            </p>
          )}
          {ev.percentA !== null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Selisih (Model A)</span>
              <span
                className="font-bold"
                style={{
                  color:
                    ev.percentA > 0
                      ? "#16a34a"
                      : ev.percentA < 0
                        ? "#dc2626"
                        : "#ca8a04",
                }}
              >
                {ev.percentA > 0 ? "+" : ""}
                {ev.percentA.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {statusIcon && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#bbf7d0]">
            {statusIcon}
            <span className="text-xs font-medium text-gray-600">{statusText}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tab: Catat ──────────────────────────────────────────────────────────────
function TabCatat({
  cows,
  token,
}: {
  cows: Cow[];
  token: string;
}) {
  const [cowId, setCowId] = useState(cows[0]?.id ?? "");
  const [date, setDate] = useState(todayISO());
  const [session, setSession] = useState<MilkSession>("MORNING");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<MilkEvaluation | null>(null);

  const amountNum = parseFloat(amount);
  const valid =
    cowId &&
    date &&
    amount !== "" &&
    !isNaN(amountNum) &&
    amountNum >= 0.1 &&
    amountNum <= 50;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    setError("");
    setEvaluation(null);
    try {
      await createMilkRecord(token, { cowId, date, session, amount: amountNum });
      // Fetch evaluation
      const ev = await getMilkEvaluation(token, cowId);
      setEvaluation(ev);
      // Reset form for next entry
      setAmount("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Pilih sapi */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Pilih Sapi</label>
        <div className="relative">
          <select
            value={cowId}
            onChange={(e) => { setCowId(e.target.value); setEvaluation(null); }}
            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            {cows.length === 0 && <option value="">— Belum ada sapi —</option>}
            {cows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.earTag}{c.name ? ` — ${c.name}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Tanggal */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Tanggal</label>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>

      {/* Toggle sesi */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Sesi</label>
        <div className="grid grid-cols-2 gap-2">
          {(["MORNING", "AFTERNOON"] as MilkSession[]).map((s) => (
            <button
              key={s}
              onClick={() => setSession(s)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition ${
                session === s
                  ? "bg-[#16a34a] border-[#16a34a] text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "MORNING" ? (
                <>
                  <Sun size={15} />
                  Pagi
                </>
              ) : (
                <>
                  <Moon size={15} />
                  Sore
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Jumlah */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">
          Jumlah Produksi (liter)
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            min={0.1}
            max={50}
            step={0.1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-3xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-300 pr-16"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-medium">
            L
          </span>
        </div>
        {amount !== "" && (isNaN(amountNum) || amountNum < 0.1 || amountNum > 50) && (
          <p className="text-[11px] text-red-500 mt-1">Jumlah harus antara 0.1–50 liter</p>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={!valid || saving || cows.length === 0}
        className="w-full py-4 rounded-2xl bg-[#16a34a] text-white font-bold text-base hover:bg-[#15803d] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>

      <AnimatePresence>
        {evaluation && <EvalCard ev={evaluation} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Mini line chart ─────────────────────────────────────────────────────────
function MiniChart({ data }: { data: { date: string; amount: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDateShort(d.date),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4">
      <p className="text-xs font-semibold text-gray-500 mb-2">Tren 7 Hari (L/hari)</p>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
            formatter={(v) => [v != null ? `${Number(v).toFixed(1)} L` : "—", "Produksi"]}
            labelStyle={{ color: "#374151" }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3, fill: "#16a34a" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Tab: Riwayat ─────────────────────────────────────────────────────────────
function TabRiwayat({ cows, token }: { cows: Cow[]; token: string }) {
  const [cowId, setCowId] = useState(cows[0]?.id ?? "");
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [trend, setTrend] = useState<{ date: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [recs, summary] = await Promise.all([
        getMilkRecords(token, { cowId: id, limit: 30 }),
        import("@/lib/milk-api").then((m) => m.getMilkSummary(token, id)),
      ]);
      setRecords(recs);
      setTrend(summary.trend);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cowId) load(cowId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cowId]);

  const grouped = groupByDate(records);

  return (
    <div>
      {/* Pilih sapi */}
      <div className="mb-4">
        <div className="relative">
          <select
            value={cowId}
            onChange={(e) => setCowId(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            {cows.length === 0 && <option value="">— Belum ada sapi —</option>}
            {cows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.earTag}{c.name ? ` — ${c.name}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-8">{error}</p>
      ) : (
        <>
          {trend.length > 0 && <MiniChart data={trend} />}
          {grouped.length === 0 ? (
            <div className="text-center py-12">
              <Droplets size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Belum ada catatan produksi</p>
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
            >
              {grouped.map(([dateKey, recs]) => (
                <motion.div
                  key={dateKey}
                  variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    {formatDate(dateKey)}
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {recs.map((r, i) => (
                      <div
                        key={r.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          i < recs.length - 1 ? "border-b border-gray-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {r.session === "MORNING" ? (
                            <Sun size={14} className="text-yellow-400" />
                          ) : (
                            <Moon size={14} className="text-indigo-400" />
                          )}
                          <span className="text-sm text-gray-600">
                            {r.session === "MORNING" ? "Pagi" : "Sore"}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          {r.amount.toFixed(1)} L
                        </span>
                      </div>
                    ))}
                    {/* Daily total if more than 1 session */}
                    {recs.length > 1 && (
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f9fafb] border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-medium">Total hari ini</span>
                        <span className="text-sm font-bold text-[#16a34a]">
                          {recs.reduce((s, r) => s + r.amount, 0).toFixed(1)} L
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = "catat" | "riwayat";

export default function ProduksiPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("catat");
  const [cows, setCows] = useState<Cow[]>([]);
  const [cowsLoading, setCowsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getCows(token, { status: "ACTIVE" })
      .then(setCows)
      .catch(() => {})
      .finally(() => setCowsLoading(false));
  }, [token]);

  return (
    <div className="px-4 pt-5 pb-6">
      {/* Header */}
      <h2 className="text-base font-bold text-gray-900 mb-4">Produksi Susu</h2>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
        {(["catat", "riwayat"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
            style={{ color: tab === t ? "#15803d" : "#6b7280" }}
          >
            {tab === t && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                transition={{ type: "spring", damping: 22, stiffness: 300 }}
              />
            )}
            <span className="relative capitalize">
              {t === "catat" ? "Catat" : "Riwayat"}
            </span>
          </button>
        ))}
      </div>

      {cowsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === "catat" ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tab === "catat" ? 12 : -12 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "catat" ? (
              <TabCatat cows={cows} token={token ?? ""} />
            ) : (
              <TabRiwayat cows={cows} token={token ?? ""} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
