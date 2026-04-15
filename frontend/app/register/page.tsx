"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Copy, Check } from "lucide-react";
import { register } from "@/lib/auth-api";

interface FormState {
  name: string;
  phone: string;
  address: string;
  farmName: string;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  address: "",
  farmName: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setError(null);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await register({
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        farmName: form.farmName || undefined,
      });
      setSuccessId(res.user.farmerId ?? null);
      // Scroll to success card
      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!successId) return;
    try {
      await navigator.clipboard.writeText(successId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: silently fail
    }
  }

  function handleReset() {
    setForm(EMPTY);
    setSuccessId(null);
    setError(null);
    setCopied(false);
  }

  function handleLoginNow() {
    if (successId) {
      router.push(`/login?id=${encodeURIComponent(successId)}`);
    }
  }

  const isSuccess = successId !== null;

  return (
    <div className="min-h-screen flex justify-center items-start bg-[#f5f0e8] px-4 py-8">
      <motion.div
        className="w-full max-w-[430px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🐄</span>
            <h1 className="text-2xl font-bold text-[#15803d] tracking-tight">SIROSA</h1>
          </div>
          <p className="text-sm text-gray-500">Daftar akun peternak baru</p>
        </div>

        {/* Form Card */}
        <div
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-opacity duration-300 ${
            isSuccess ? "opacity-50 pointer-events-none select-none" : ""
          }`}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Buat Akun</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Nama lengkap Anda"
                required
                disabled={isSuccess}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="08xxxxxxxxxx"
                disabled={isSuccess}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <input
                type="text"
                value={form.address}
                onChange={set("address")}
                placeholder="Alamat tempat tinggal"
                disabled={isSuccess}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Peternakan
              </label>
              <input
                type="text"
                value={form.farmName}
                onChange={set("farmName")}
                placeholder="Nama peternakan Anda"
                disabled={isSuccess}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition disabled:bg-gray-50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || isSuccess}
              className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] mt-1 ${
                loading || isSuccess
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#15803d] text-white shadow-md shadow-[#15803d]/30"
              }`}
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#16a34a] font-medium hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Success Card */}
        <AnimatePresence>
          {isSuccess && successId && (
            <motion.div
              ref={successRef}
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-6 shadow-sm"
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={22} className="text-[#16a34a]" />
                </div>
                <div>
                  <p className="font-bold text-[#15803d] text-base">Pendaftaran Berhasil!</p>
                  <p className="text-xs text-[#166534] mt-0.5">Simpan ID berikut untuk masuk</p>
                </div>
              </div>

              {/* Farmer ID */}
              <div className="bg-white rounded-xl border border-[#bbf7d0] px-4 py-4 mb-4 text-center">
                <p className="text-xs text-gray-500 mb-1">ID Peternak Anda:</p>
                <p className="text-4xl font-bold text-[#15803d] tracking-widest mb-3">
                  {successId}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    copied
                      ? "bg-[#dcfce7] text-[#15803d]"
                      : "bg-[#f0fdf4] border border-[#86efac] text-[#16a34a] hover:bg-[#dcfce7]"
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Disalin!" : "Salin ID"}
                </button>
              </div>

              <p className="text-xs text-center text-[#166534] mb-4">
                Gunakan ID ini untuk masuk ke SIROSA
              </p>

              {/* CTA Buttons */}
              <button
                type="button"
                onClick={handleLoginNow}
                className="w-full py-3.5 rounded-xl bg-[#15803d] text-white font-semibold text-sm shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition active:scale-[0.98] mb-2"
              >
                Masuk Sekarang
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 rounded-xl border border-[#86efac] text-[#16a34a] text-sm font-medium hover:bg-[#f0fdf4] transition"
              >
                Daftar akun lain
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
