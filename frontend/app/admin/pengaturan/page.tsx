"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Info, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateMe, changePassword } from "@/lib/auth-api";
import { getSystemInfo, type SystemInfo } from "@/lib/users-api";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#dcfce7] flex items-center justify-center">
          <Icon size={16} className="text-[#2d6a4f]" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────
function Alert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm mt-3 ${
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
      {message}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition"
      />
    </div>
  );
}

// ─── Profil section ───────────────────────────────────────────────────────────
function ProfilSection() {
  const { user, token, setAuth } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  async function handleSave() {
    if (!token || !name.trim() || !email.trim()) return;
    setSaving(true);
    setAlert(null);
    try {
      const updated = await updateMe(token, { name: name.trim(), email: email.trim() });
      setAuth(token, updated);
      setAlert({ type: "success", msg: "Profil berhasil diperbarui" });
    } catch (e) {
      setAlert({
        type: "error",
        msg: e instanceof Error ? e.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
    }
  }

  const changed =
    name.trim() !== (user?.name ?? "") ||
    email.trim() !== (user?.email ?? "");

  return (
    <Section title="Profil Admin" icon={User} delay={0}>
      <div className="space-y-3 max-w-sm">
        <Field label="Nama" value={name} onChange={setName} placeholder="Nama admin" />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="email@example.com"
        />
        {alert && <Alert type={alert.type} message={alert.msg} />}
        <button
          onClick={handleSave}
          disabled={!changed || saving}
          className="mt-1 px-5 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1a4535] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </Section>
  );
}

// ─── Password section ─────────────────────────────────────────────────────────
function PasswordSection() {
  const { token } = useAuth();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  async function handleChange() {
    if (!token) return;
    if (newPw !== confirmPw) {
      setAlert({ type: "error", msg: "Password baru tidak cocok" });
      return;
    }
    if (newPw.length < 6) {
      setAlert({ type: "error", msg: "Password baru minimal 6 karakter" });
      return;
    }
    setSaving(true);
    setAlert(null);
    try {
      const res = await changePassword(token, {
        oldPassword: oldPw,
        newPassword: newPw,
      });
      setAlert({ type: "success", msg: res.message });
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setAlert({
        type: "error",
        msg: e instanceof Error ? e.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = oldPw.length > 0 && newPw.length >= 6 && confirmPw.length >= 6;

  return (
    <Section title="Ubah Password" icon={Lock} delay={0.08}>
      <div className="space-y-3 max-w-sm">
        <Field
          label="Password Lama"
          type="password"
          value={oldPw}
          onChange={setOldPw}
          placeholder="Masukkan password saat ini"
        />
        <Field
          label="Password Baru"
          type="password"
          value={newPw}
          onChange={setNewPw}
          placeholder="Minimal 6 karakter"
        />
        <Field
          label="Konfirmasi Password Baru"
          type="password"
          value={confirmPw}
          onChange={setConfirmPw}
          placeholder="Ulangi password baru"
        />
        {alert && <Alert type={alert.type} message={alert.msg} />}
        <button
          onClick={handleChange}
          disabled={!canSubmit || saving}
          className="mt-1 px-5 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1a4535] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Mengubah..." : "Ubah Password"}
        </button>
      </div>
    </Section>
  );
}

// ─── System info section ──────────────────────────────────────────────────────
function SystemInfoSection() {
  const { token } = useAuth();
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getSystemInfo(token)
      .then(setInfo)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [token]);

  const items = info
    ? [
        { label: "Versi Aplikasi", value: info.version },
        { label: "Total Peternak", value: `${info.totalUsers} pengguna` },
        { label: "Total Sapi", value: `${info.totalCows} ekor` },
        {
          label: "Total Catatan Produksi",
          value: `${info.totalMilkRecords} record`,
        },
      ]
    : [];

  return (
    <Section title="Info Sistem" icon={Info} delay={0.16}>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5 max-w-sm">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPengaturanPage() {
  return (
    <div>
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-bold text-gray-900 mb-5"
      >
        Pengaturan
      </motion.h2>

      <div className="space-y-4 max-w-lg">
        <ProfilSection />
        <PasswordSection />
        <SystemInfoSection />
      </div>
    </div>
  );
}
