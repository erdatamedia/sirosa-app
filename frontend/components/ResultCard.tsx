"use client";

import { motion } from "framer-motion";
import type { PredictResponse } from "@/lib/api";

interface Props {
  result: PredictResponse;
  onReset: () => void;
}

export default function ResultCard({ result, onReset }: Props) {
  const { model, result: value, inputs } = result;

  const rows =
    model === "A"
      ? [
          { label: "Paritas", val: inputs.parity, unit: "" },
          { label: "Bulan Laktasi", val: inputs.ll, unit: "bulan" },
          { label: "BCS", val: inputs.bcs, unit: "" },
        ]
      : [
          { label: "Bulan Laktasi", val: inputs.ll, unit: "bulan" },
          { label: "BCS", val: inputs.bcs, unit: "" },
          { label: "Bobot Badan", val: inputs.weight, unit: "kg" },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex flex-col gap-5"
    >
      {/* Result highlight */}
      <div className="bg-[#2d6a4f] rounded-2xl p-6 text-white text-center shadow-lg">
        <p className="text-sm font-medium opacity-80 mb-1">
          Estimasi Produksi Susu
        </p>
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
          className="text-5xl font-bold tracking-tight"
        >
          {value.toFixed(2)}
        </motion.p>
        <p className="text-sm opacity-70 mt-1">liter / hari</p>
        <div className="mt-3 inline-block bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
          Model {model} — {model === "A" ? "Tanpa Bobot Badan" : "Dengan Bobot Badan"}
        </div>
      </div>

      {/* Input summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Input yang digunakan
        </p>
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{r.label}</span>
              <span className="font-semibold text-gray-800">
                {r.val} {r.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hitung ulang */}
      <button
        onClick={onReset}
        className="w-full py-3 rounded-xl border-2 border-[#2d6a4f] text-[#2d6a4f] font-semibold text-sm active:scale-[0.98] transition-transform"
      >
        Hitung Ulang
      </button>
    </motion.div>
  );
}
