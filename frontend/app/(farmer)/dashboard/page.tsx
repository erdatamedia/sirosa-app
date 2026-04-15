"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Droplets,
  Beef,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  List,
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
import { type FarmerDashboard, getFarmerDashboard } from "@/lib/dashboard-api";

// ─── Greeting ─────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, decimals = 0, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target * Math.pow(10, decimals)) / Math.pow(10, decimals));
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
  value,
  unit,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  const displayed = useCountUp(value, unit === "liter" ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-black text-gray-900 leading-none">
        {unit === "liter" ? displayed.toFixed(1) : displayed}
      </p>
      <p className="text-[11px] text-gray-400 mt-0.5">{unit}</p>
    </motion.div>
  );
}

// ─── Mini chart ───────────────────────────────────────────────────────────────
function TrendChart({ data }: { data: { date: string; total: number }[] }) {
  const formatted = data.map((d) => ({
    total: d.total,
    label: new Date(d.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3">
        Tren produksi 7 hari terakhir
      </p>
      {data.every((d) => d.total === 0) ? (
        <p className="text-xs text-gray-400 text-center py-8">
          Belum ada data produksi. Mulai catat produksi susu sapi Anda.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
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
              width={36}
            />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(v) => [v != null ? `${Number(v).toFixed(1)} L` : "—", "Produksi"]}
              labelStyle={{ color: "#374151" }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#16a34a" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<FarmerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getFarmerDashboard(token)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const firstName = user?.name?.split(" ")[0] ?? "";

  if (loading) {
    return (
      <div className="px-4 pt-5 pb-6 space-y-4">
        <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const d = data ?? {
    farmName: null,
    totalCows: 0,
    totalActiveCows: 0,
    todayProduction: 0,
    avgProductionPerCow: 0,
    cowsRecordedToday: 0,
    productionTrend: [],
    topCows: [],
    lowCows: [],
  };

  const recordedPct =
    d.totalActiveCows > 0
      ? Math.round((d.cowsRecordedToday / d.totalActiveCows) * 100)
      : 0;

  return (
    <div className="px-4 pt-5 pb-6 space-y-4">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-bold text-gray-900">
          {greeting()}, {firstName} 👋
        </h2>
        {d.farmName && (
          <p className="text-xs text-gray-400 mt-0.5">{d.farmName}</p>
        )}
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Sapi Aktif"
          value={d.totalCows}
          unit="ekor"
          icon={Beef}
          color="#16a34a"
          delay={0.05}
        />
        <StatCard
          label="Produksi Hari Ini"
          value={d.todayProduction}
          unit="liter"
          icon={Droplets}
          color="#0891b2"
          delay={0.1}
        />
      </div>

      {/* Progress: sapi dicatat */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600">
            Sudah dicatat hari ini
          </p>
          <p className="text-xs font-bold text-[#16a34a]">
            {d.cowsRecordedToday} / {d.totalActiveCows} sapi
          </p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <motion.div
            className="h-2.5 rounded-full bg-[#16a34a]"
            initial={{ width: 0 }}
            animate={{ width: `${recordedPct}%` }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">
          {d.totalActiveCows === 0
            ? "Belum ada sapi aktif"
            : recordedPct === 100
              ? "Semua sapi sudah dicatat hari ini 🎉"
              : `${d.totalActiveCows - d.cowsRecordedToday} sapi belum dicatat`}
        </p>
      </motion.div>

      {/* Trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <TrendChart data={d.productionTrend} />
      </motion.div>

      {/* Top & Low cows */}
      {(d.topCows.length > 0 || d.lowCows.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Top */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} className="text-[#16a34a]" />
              <p className="text-[11px] font-semibold text-gray-500">Tertinggi</p>
            </div>
            {d.topCows.length === 0 ? (
              <p className="text-[11px] text-gray-300">—</p>
            ) : (
              <div className="space-y-1.5">
                {d.topCows.slice(0, 2).map((c) => (
                  <div key={c.earTag}>
                    <p className="text-xs font-bold text-gray-800">{c.earTag}</p>
                    <p className="text-[10px] text-[#16a34a]">
                      {c.avgProduction.toFixed(1)} L/hari
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={13} className="text-amber-500" />
              <p className="text-[11px] font-semibold text-gray-500">Terendah</p>
            </div>
            {d.lowCows.length === 0 ? (
              <p className="text-[11px] text-gray-300">—</p>
            ) : (
              <div className="space-y-1.5">
                {d.lowCows.slice(0, 2).map((c) => (
                  <div key={c.earTag}>
                    <p className="text-xs font-bold text-gray-800">{c.earTag}</p>
                    <p className="text-[10px] text-amber-500">
                      {c.avgProduction.toFixed(1)} L/hari
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <button
          onClick={() => router.push("/produksi")}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#16a34a] text-[#16a34a] text-sm font-semibold hover:bg-[#f0fdf4] transition"
        >
          <ClipboardList size={16} />
          Catat Produksi
        </button>
        <button
          onClick={() => router.push("/ternak")}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
        >
          <List size={16} />
          Lihat Ternak
        </button>
      </motion.div>
    </div>
  );
}
