"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Beef,
  Users,
  Droplets,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Home,
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
import { type AdminDashboard, getAdminDashboard } from "@/lib/dashboard-api";

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, decimals = 0, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(
        Math.round(eased * target * Math.pow(10, decimals)) /
          Math.pow(10, decimals),
      );
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, decimals, duration]);

  return value;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  rawValue,
  display,
  sub,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  rawValue: number;
  display?: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  const counted = useCountUp(rawValue, display?.includes(".") ? 1 : 0);
  const shown = display ?? String(counted);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight">{shown}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Trend chart ─────────────────────────────────────────────────────────────
function TrendChart({ data }: { data: { date: string; total: number }[] }) {
  const formatted = data.map((d) => ({
    total: d.total,
    label: new Date(d.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
  }));

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">
        Tren Produksi 7 Hari (L/hari)
      </p>
      {!hasData ? (
        <div className="flex items-center justify-center h-[250px]">
          <p className="text-sm text-gray-400 text-center max-w-xs">
            Belum ada data produksi. Mulai catat produksi susu sapi Anda.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
              formatter={(v) => [v != null ? `${Number(v).toFixed(1)} L` : "—", "Produksi"]}
              labelStyle={{ color: "#374151", fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getAdminDashboard(token)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 h-80 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="col-span-2 h-80 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 p-4">{error}</p>;
  }

  const d = data ?? {
    totalCows: 0,
    totalFarms: 0,
    totalFarmers: 0,
    todayProduction: 0,
    avgProductionPerCow: 0,
    cowsRecordedToday: 0,
    productionTrend: [],
    topCows: [],
    alertCows: [],
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard Admin</h2>
        <p className="text-sm text-gray-400 mt-0.5">Ringkasan data sistem SIROSA</p>
      </div>

      {/* ── Baris 1: 4 stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Sapi Aktif"
          rawValue={d.totalCows}
          icon={Beef}
          color="#16a34a"
          delay={0}
        />
        <StatCard
          label="Total Peternak"
          rawValue={d.totalFarmers}
          sub={`${d.totalFarms} farm terdaftar`}
          icon={Users}
          color="#2563eb"
          delay={0.06}
        />
        <StatCard
          label="Produksi Hari Ini"
          rawValue={d.todayProduction}
          display={`${d.todayProduction.toFixed(1)} L`}
          sub={`rata-rata ${d.avgProductionPerCow.toFixed(1)} L/sapi`}
          icon={Droplets}
          color="#0891b2"
          delay={0.12}
        />
        <StatCard
          label="Sapi Dicatat Hari Ini"
          rawValue={d.cowsRecordedToday}
          sub={`dari ${d.totalCows} sapi aktif`}
          icon={CheckCircle}
          color="#d97706"
          delay={0.18}
        />
      </div>

      {/* ── Baris 2: Chart + Top Cows ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Chart — 60% */}
        <motion.div
          className="xl:col-span-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <TrendChart data={d.productionTrend} />
        </motion.div>

        {/* Top 5 Cows — 40% */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-amber-500" />
              <p className="text-sm font-semibold text-gray-700">Top 5 Sapi</p>
              <span className="text-[11px] text-gray-400 ml-auto">rata-rata 7 hari</span>
            </div>

            {d.topCows.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                Belum ada data produksi
              </p>
            ) : (
              <div className="space-y-3">
                {d.topCows.map((c, i) => (
                  <motion.div
                    key={c.earTag}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : "#f9fafb",
                        color: i === 0 ? "#d97706" : i === 1 ? "#64748b" : "#9ca3af",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {c.earTag}
                        {c.name ? (
                          <span className="font-normal text-gray-400 ml-1">{c.name}</span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Home size={10} />
                        {c.farmName}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#16a34a] flex-shrink-0">
                      {c.avgProduction.toFixed(1)} L
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Baris 3: Alert cows ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-500" />
          <p className="text-sm font-semibold text-gray-700">Perlu Perhatian</p>
          <span className="text-[11px] text-gray-400 ml-auto">
            produksi &lt; prediksi −20%
          </span>
        </div>

        {d.alertCows.length === 0 ? (
          <div className="flex items-center gap-2 py-3">
            <span className="w-2 h-2 rounded-full bg-[#16a34a] flex-shrink-0" />
            <p className="text-sm text-gray-500">
              Semua sapi berproduksi normal
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {d.alertCows.map((c, i) => (
              <motion.div
                key={c.earTag}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{c.earTag}</p>
                    {c.name && (
                      <p className="text-xs text-gray-400">{c.name}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Home size={10} />
                    {c.farmName}
                    <span className="mx-1">·</span>
                    Aktual {c.actual.toFixed(1)} L vs Prediksi {c.predicted.toFixed(1)} L
                  </p>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  ↓ {Math.abs(c.percent).toFixed(1)}%
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
