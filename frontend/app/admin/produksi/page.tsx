"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, Droplets, Users, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import {
  type MilkRecord,
  type AdminStats,
  getMilkRecords,
  deleteMilkRecord,
  getAdminStats,
  getAdminTrend,
} from "@/lib/milk-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

interface Farm {
  id: string;
  name: string;
}

interface Cow {
  id: string;
  earTag: string;
  name: string | null;
  farmId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminProduksiPage() {
  const { token } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [farmFilter, setFarmFilter] = useState("");
  const [cowFilter, setCowFilter] = useState("");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [trend, setTrend] = useState<{ date: string; amount: number }[]>([]);
  const [records, setRecords] = useState<MilkRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredCows = farmFilter
    ? cows.filter((c) => c.farmId === farmFilter)
    : cows;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [farmData, cowData, statsData, trendData, recData] =
        await Promise.all([
          fetch(`${API_URL}/cows/farms/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json() as Promise<Farm[]>),
          fetch(`${API_URL}/cows`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json() as Promise<Cow[]>),
          getAdminStats(token, farmFilter || undefined),
          getAdminTrend(token, farmFilter || undefined),
          getMilkRecords(token, {
            cowId: cowFilter || undefined,
            limit: 50,
          }),
        ]);

      setFarms(farmData);
      setCows(cowData);
      setStats(statsData);
      setTrend(trendData);
      setRecords(recData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, farmFilter, cowFilter]);

  async function handleDelete(id: string) {
    if (!token) return;
    setDeleting(id);
    try {
      await deleteMilkRecord(token, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      // Refresh stats
      const s = await getAdminStats(token, farmFilter || undefined);
      setStats(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  const trendFormatted = trend.map((d) => ({
    ...d,
    label: formatDateShort(d.date),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Produksi Susu</h2>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total hari ini"
            value={`${stats.totalToday.toFixed(1)} L`}
            icon={Droplets}
            color="#16a34a"
          />
          <StatCard
            label="Rata-rata/sapi"
            value={`${stats.avgPerCow.toFixed(1)} L`}
            icon={TrendingUp}
            color="#2563eb"
          />
          <StatCard
            label="Sapi dicatat"
            value={String(stats.cowsToday)}
            sub="hari ini"
            icon={Users}
            color="#ca8a04"
          />
        </div>
      )}

      {/* Area chart */}
      {trendFormatted.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Tren Produksi 7 Hari (L/hari)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={trendFormatted}
              margin={{ top: 4, right: 8, bottom: 0, left: -8 }}
            >
              <defs>
                <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(v) => [v != null ? `${Number(v).toFixed(1)} L` : "—", "Produksi"]}
                labelStyle={{ color: "#374151" }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#milkGradient)"
                dot={{ r: 3, fill: "#16a34a" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <select
            value={farmFilter}
            onChange={(e) => { setFarmFilter(e.target.value); setCowFilter(""); }}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-300 cursor-pointer"
          >
            <option value="">Semua Farm</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={cowFilter}
            onChange={(e) => setCowFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-300 cursor-pointer"
          >
            <option value="">Semua Sapi</option>
            {filteredCows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.earTag}{c.name ? ` — ${c.name}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {error && (
        <p className="text-sm text-red-500 mb-4 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-sm text-gray-400 py-16 text-center">
          Belum ada data produksi susu.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Sapi</th>
                  <th className="px-4 py-3 text-center">Sesi</th>
                  <th className="px-4 py-3 text-right">Jumlah (L)</th>
                  <th className="px-4 py-3 text-left">Dicatat oleh</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {records.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03, duration: 0.18 }}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {r.cow.earTag}
                        {r.cow.name ? (
                          <span className="font-normal text-gray-400 ml-1">
                            {r.cow.name}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            r.session === "MORNING"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {r.session === "MORNING" ? "Pagi" : "Sore"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {r.amount.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.recordedBy.name}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                          title="Hapus"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
