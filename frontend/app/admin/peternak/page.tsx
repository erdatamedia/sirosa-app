"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fragment } from "react";
import {
  Users,
  Building2,
  Beef,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFarmers, type FarmerUser } from "@/lib/users-api";

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Cow status badge ────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> =
  {
    ACTIVE: { label: "Aktif", color: "#16a34a", bg: "#dcfce7" },
    DRY: { label: "Kering", color: "#ca8a04", bg: "#fef9c3" },
    CULLED: { label: "Afkir", color: "#dc2626", bg: "#fee2e2" },
  };

function CowBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Detail panel ────────────────────────────────────────────────────────────
function DetailPanel({ farmer }: { farmer: FarmerUser }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <td colSpan={7} className="px-4 py-0">
        <div className="bg-[#f0fdf4] rounded-xl p-4 mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Farmer detail */}
          <div>
            <p className="text-xs font-semibold text-[#15803d] mb-2 uppercase tracking-wide">
              Info Peternak
            </p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400 flex-shrink-0" />
                <span>{farmer.phone ?? "—"}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{farmer.address ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                <span>
                  Daftar:{" "}
                  {new Date(farmer.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Cows */}
          {farmer.farm && farmer.farm.cows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#15803d] mb-2 uppercase tracking-wide">
                Daftar Sapi ({farmer.farm.cows.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {farmer.farm.cows.map((cow) => (
                  <div
                    key={cow.id}
                    className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-green-100"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {cow.earTag}
                    </span>
                    {cow.name && (
                      <span className="text-xs text-gray-400">{cow.name}</span>
                    )}
                    <CowBadge status={cow.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {farmer.farm && farmer.farm.cows.length === 0 && (
            <div>
              <p className="text-xs font-semibold text-[#15803d] mb-2 uppercase tracking-wide">
                Daftar Sapi
              </p>
              <p className="text-sm text-gray-400">Belum ada sapi terdaftar</p>
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AdminPeternakPage() {
  const { token } = useAuth();
  const [farmers, setFarmers] = useState<FarmerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getFarmers(token)
      .then(setFarmers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const totalFarms = farmers.filter((f) => f.farm != null).length;
  const totalCows = farmers.reduce((s, f) => s + (f.farm?.cowCount ?? 0), 0);
  const avgCowsPerFarm =
    totalFarms > 0 ? (totalCows / totalFarms).toFixed(1) : "0";

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-5">Data Peternak</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Total Peternak"
          value={farmers.length}
          icon={Users}
          color="#2d6a4f"
          delay={0}
        />
        <StatCard
          label="Total Farm"
          value={totalFarms}
          icon={Building2}
          color="#0284c7"
          delay={0.05}
        />
        <StatCard
          label="Rata-rata Sapi/Farm"
          value={avgCowsPerFarm}
          icon={Beef}
          color="#ca8a04"
          delay={0.1}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 py-8 text-center">{error}</div>
      ) : farmers.length === 0 ? (
        <div className="text-sm text-gray-400 py-16 text-center">
          Belum ada peternak terdaftar.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">No HP</th>
                  <th className="px-4 py-3 text-left">Nama Farm</th>
                  <th className="px-4 py-3 text-left">Alamat Farm</th>
                  <th className="px-4 py-3 text-center">Jml Sapi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {farmers.map((farmer, i) => (
                    <Fragment key={farmer.id}>
                      <motion.tr
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {farmer.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {farmer.email}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {farmer.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {farmer.farm?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                          {farmer.farm?.address ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {farmer.farm ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#dcfce7] text-[#15803d] text-xs font-bold">
                              {farmer.farm.cowCount}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleExpand(farmer.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#2d6a4f] hover:bg-[#f0fdf4] px-2.5 py-1.5 rounded-lg transition"
                          >
                            {expandedId === farmer.id ? (
                              <>
                                Tutup <ChevronUp size={13} />
                              </>
                            ) : (
                              <>
                                Lihat Detail <ChevronDown size={13} />
                              </>
                            )}
                          </button>
                        </td>
                      </motion.tr>

                      <AnimatePresence>
                        {expandedId === farmer.id && (
                          <DetailPanel key={`detail-${farmer.id}`} farmer={farmer} />
                        )}
                      </AnimatePresence>
                    </Fragment>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
