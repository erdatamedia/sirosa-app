"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getCows, type Cow } from "@/lib/cow-api";
import { getMilkEvaluation, type MilkEvaluation } from "@/lib/milk-api";
import PredictionForm from "@/components/PredictionForm";
import type { PredictResponse, PredictionModel } from "@/lib/api";

export default function PrediksiPage() {
  const { token } = useAuth();
  const [cows, setCows] = useState<Cow[]>([]);
  const [selectedCowId, setSelectedCowId] = useState("");
  const [evaluation, setEvaluation] = useState<MilkEvaluation | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [lastModel, setLastModel] = useState<PredictionModel>("A");
  const [hasPredicted, setHasPredicted] = useState(false);

  useEffect(() => {
    if (!token) return;
    getCows(token, { status: "ACTIVE" }).then(setCows).catch(() => null);
  }, [token]);

  // Reset evaluation when cow changes
  useEffect(() => {
    setEvaluation(null);
    setHasPredicted(false);
  }, [selectedCowId]);

  const selectedCow = cows.find((c) => c.id === selectedCowId) ?? null;

  const initialValues = selectedCow
    ? {
        parity: String(selectedCow.parity),
        ll:
          selectedCow.lactationMonth != null
            ? String(selectedCow.lactationMonth)
            : "",
        bcs:
          selectedCow.currentBCS != null
            ? String(selectedCow.currentBCS)
            : "",
        weight:
          selectedCow.currentWeight != null
            ? String(selectedCow.currentWeight)
            : "",
      }
    : undefined;

  async function handlePredicted(_res: PredictResponse, model: PredictionModel) {
    setLastModel(model);
    setHasPredicted(true);
    if (!selectedCowId || !token) return;
    setEvalLoading(true);
    try {
      const ev = await getMilkEvaluation(token, selectedCowId);
      setEvaluation(ev);
    } catch {
      // show "no data" state
      setEvaluation(null);
    } finally {
      setEvalLoading(false);
    }
  }

  const statusColor = (status: string) => {
    if (status === "above") return "bg-green-100 text-green-700";
    if (status === "below") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <motion.div
      className="px-4 py-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Prediksi Produksi Susu
      </h2>

      {/* Cow selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">
          Pilih Sapi
        </label>
        <div className="relative">
          <select
            value={selectedCowId}
            onChange={(e) => setSelectedCowId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200 pl-3 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="">Input Manual</option>
            {cows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.earTag}
                {c.name ? ` — ${c.name}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <PredictionForm
          initialValues={initialValues}
          onPredicted={handlePredicted}
        />
      </div>

      {/* Evaluation card */}
      <AnimatePresence>
        {selectedCowId && hasPredicted && (
          <motion.div
            key="eval"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Perbandingan Aktual
            </p>
            {evalLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/2" />
              </div>
            ) : evaluation?.actualAvg == null ? (
              <p className="text-sm text-gray-400">
                Belum ada data produksi untuk sapi ini
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Aktual rata-rata 7 hari:{" "}
                  <span className="font-semibold text-gray-900">
                    {evaluation.actualAvg.toFixed(1)} L/hari
                  </span>
                </p>
                {lastModel === "A" && evaluation.percentA != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Selisih:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(evaluation.status)}`}
                    >
                      {evaluation.percentA > 0 ? "+" : ""}
                      {evaluation.percentA.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400">
                      ({evaluation.status === "above"
                        ? "di atas prediksi"
                        : evaluation.status === "below"
                        ? "di bawah prediksi"
                        : "sesuai prediksi"}
                      )
                    </span>
                  </div>
                )}
                {lastModel === "B" && evaluation.percentB != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Selisih:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(evaluation.status)}`}
                    >
                      {evaluation.percentB > 0 ? "+" : ""}
                      {evaluation.percentB.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400">
                      ({evaluation.status === "above"
                        ? "di atas prediksi"
                        : evaluation.status === "below"
                        ? "di bawah prediksi"
                        : "sesuai prediksi"}
                      )
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
