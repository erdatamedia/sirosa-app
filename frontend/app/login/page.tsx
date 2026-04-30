"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { login } from "@/lib/auth-api";

type Tab = "farmer" | "admin";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();

  const prefillId = searchParams.get("id") ?? "";
  const [tab, setTab] = useState<Tab>("farmer");

  // Farmer form state
  const [farmerId, setFarmerId] = useState(prefillId);

  // Admin form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTabChange(next: Tab) {
    setTab(next);
    setError(null);
  }

  async function handleFarmerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login({ identifier: farmerId.trim() });
      setAuth(res.token, res.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login({ identifier: email, password });
      setAuth(res.token, res.user);
      if (res.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#f5f0e8] px-4">
      <motion.div
        className="w-full max-w-[430px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🐄</span>
            <h1 className="text-2xl font-bold text-[#15803d] tracking-tight">SIROSA</h1>
          </div>
          <p className="text-sm text-gray-500">Aplikasi Prediksi Produksi Susu Sapi Perah</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Masuk ke Akun</h2>

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-5 gap-1">
            <button
              type="button"
              onClick={() => handleTabChange("farmer")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "farmer"
                  ? "bg-white text-[#15803d] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Peternak
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("admin")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === "admin"
                  ? "bg-white text-[#15803d] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Admin / Petugas
            </button>
          </div>

          {/* Farmer Tab */}
          {tab === "farmer" && (
            <motion.form
              key="farmer"
              onSubmit={handleFarmerSubmit}
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Peternak
                </label>
                <input
                  type="text"
                  value={farmerId}
                  onChange={(e) => {
                    setFarmerId(e.target.value);
                    setError(null);
                  }}
                  placeholder="Masukkan ID Peternak, contoh: PTR001"
                  required
                  autoCapitalize="characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !farmerId.trim()}
                className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] mt-1 ${
                  loading || !farmerId.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#15803d] text-white shadow-md shadow-[#15803d]/30"
                }`}
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>

              <p className="text-center text-sm text-gray-500">
                Belum punya akun?{" "}
                <Link href="/register" className="text-[#16a34a] font-medium hover:underline">
                  Daftar
                </Link>
              </p>
            </motion.form>
          )}

          {/* Admin Tab */}
          {tab === "admin" && (
            <motion.form
              key="admin"
              onSubmit={handleAdminSubmit}
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Password"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] mt-1 ${
                  loading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#15803d] text-white shadow-md shadow-[#15803d]/30"
                }`}
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
