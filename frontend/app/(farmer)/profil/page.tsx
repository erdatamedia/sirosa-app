"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  MapPin,
  User,
  Building2,
  Beef,
  LogOut,
  CheckCircle,
  AlertCircle,
  Hash,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { updateMe } from "@/lib/auth-api";
import { getFarmerDashboard } from "@/lib/dashboard-api";

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-[430px] bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────
function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${
        type === "success"
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={15} />
      ) : (
        <AlertCircle size={15} />
      )}
      {msg}
    </div>
  );
}

// ─── Edit profil modal ────────────────────────────────────────────────────────
function EditProfilModal({ onClose }: { onClose: () => void }) {
  const { user, token, setAuth } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  async function handleSave() {
    if (!token || !name.trim()) return;
    setSaving(true);
    setAlert(null);
    try {
      const updated = await updateMe(token, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setAuth(token, updated);
      setAlert({ type: "success", msg: "Profil berhasil diperbarui" });
      setTimeout(onClose, 1000);
    } catch (e) {
      setAlert({
        type: "error",
        msg: e instanceof Error ? e.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">
          Nama
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          placeholder="Nama lengkap"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">
          No HP
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">
          Alamat
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
          placeholder="Alamat lengkap"
        />
      </div>
      {alert && <Alert type={alert.type} msg={alert.msg} />}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex-1 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1a4535] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProfilPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [farmName, setFarmName] = useState<string | null>(null);
  const [totalCows, setTotalCows] = useState<number>(0);
  const [showEditProfil, setShowEditProfil] = useState(false);

  useEffect(() => {
    if (!token) return;
    getFarmerDashboard(token)
      .then((d) => {
        setFarmName(d.farmName);
        setTotalCows(d.totalActiveCows);
      })
      .catch(() => null);
  }, [token]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <motion.div
      className="px-4 py-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Profil Saya
      </h2>

      {/* Profil card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-3"
      >
        {/* Farmer ID — prominent at the top */}
        {user?.farmerId && (
          <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3 mb-4">
            <Hash size={16} className="text-[#15803d] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-[#166534] font-medium">ID Peternak</p>
              <p className="text-2xl font-bold text-[#15803d] tracking-widest leading-tight">
                {user.farmerId}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#15803d] font-bold text-xl flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
            <span className="inline-block mt-0.5 text-xs bg-[#dcfce7] text-[#15803d] rounded-full px-2 py-0.5 font-medium">
              Peternak
            </span>
          </div>
        </div>

        <div className="space-y-2.5 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Phone size={15} className="text-gray-400 flex-shrink-0" />
            <span>{user?.phone ?? "—"}</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-700">
            <MapPin
              size={15}
              className="text-gray-400 flex-shrink-0 mt-0.5"
            />
            <span>{user?.address ?? "—"}</span>
          </div>
        </div>

        <button
          onClick={() => setShowEditProfil(true)}
          className="mt-4 w-full py-2.5 rounded-xl border border-[#2d6a4f] text-[#2d6a4f] text-sm font-semibold hover:bg-[#f0fdf4] transition flex items-center justify-center gap-2"
        >
          <User size={14} />
          Edit Profil
        </button>
      </motion.div>

      {/* Farm card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-3"
      >
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
          Data Farm
        </p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Building2 size={15} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium">
              {farmName ?? (
                <span className="text-gray-400 font-normal">Belum ada farm</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Beef size={15} className="text-gray-400 flex-shrink-0" />
            <span>
              <span className="font-semibold text-gray-900">{totalCows}</span>{" "}
              sapi aktif
            </span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
        className="space-y-2"
      >
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-medium text-sm hover:bg-red-100 transition flex items-center justify-center gap-2"
        >
          <LogOut size={14} />
          Keluar
        </button>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showEditProfil && (
          <Modal title="Edit Profil" onClose={() => setShowEditProfil(false)}>
            <EditProfilModal onClose={() => setShowEditProfil(false)} />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
