"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Droplets, BarChart2, Bell, Beef } from "lucide-react";

const features = [
  {
    icon: Droplets,
    color: "#0891b2",
    title: "Catat Produksi Susu",
    desc: "Rekam produksi setiap sapi secara harian, pagi dan sore hari.",
  },
  {
    icon: BarChart2,
    color: "#16a34a",
    title: "Prediksi Produksi",
    desc: "Estimasi produksi berdasarkan paritas, BCS, dan bobot badan.",
  },
  {
    icon: Bell,
    color: "#d97706",
    title: "Deteksi Anomali",
    desc: "Notifikasi otomatis saat produksi sapi jauh di bawah prediksi.",
  },
  {
    icon: Beef,
    color: "#7c3aed",
    title: "Manajemen Ternak",
    desc: "Kelola data sapi, riwayat kesehatan, dan status laktasi.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center">
      <div className="w-full max-w-[430px] px-5 pt-12 pb-16 flex flex-col">

        {/* Hero */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#15803d] flex items-center justify-center shadow-lg shadow-[#15803d]/30">
              <span className="text-3xl">🐄</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#15803d] tracking-tight mb-2">
            SIROSA
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[280px] mx-auto">
            Sistem Informasi Produksi Susu Sapi Perah berbasis prediksi regresi linier
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${f.color}18` }}
              >
                <f.icon size={18} style={{ color: f.color }} />
              </div>
              <p className="text-xs font-bold text-gray-800 leading-snug mb-1">
                {f.title}
              </p>
              <p className="text-[11px] text-gray-400 leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
        >
          <Link
            href="/login"
            className="w-full py-4 rounded-2xl bg-[#15803d] text-white text-sm font-bold text-center shadow-md shadow-[#15803d]/30 active:scale-[0.98] transition"
          >
            Masuk ke Akun
          </Link>
          <Link
            href="/register"
            className="w-full py-4 rounded-2xl border-2 border-[#15803d] text-[#15803d] text-sm font-bold text-center active:scale-[0.98] transition hover:bg-[#f0fdf4]"
          >
            Daftar Sebagai Peternak
          </Link>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center text-[11px] text-gray-400 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Dirancang khusus untuk peternak sapi perah Indonesia
        </motion.p>
      </div>
    </div>
  );
}
