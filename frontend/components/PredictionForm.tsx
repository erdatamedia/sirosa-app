"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ModelToggle from "./ModelToggle";
import InputField from "./InputField";
import ResultCard from "./ResultCard";
import { predict, type PredictionModel, type PredictResponse } from "@/lib/api";

interface FormState {
  parity: string;
  ll: string;
  bcs: string;
  weight: string;
}

const EMPTY: FormState = { parity: "", ll: "", bcs: "", weight: "" };

function inRange(val: string, min: number, max: number): boolean {
  const n = parseFloat(val);
  return val !== "" && !isNaN(n) && n >= min && n <= max;
}

interface PredictionFormProps {
  initialValues?: Partial<FormState>;
  onPredicted?: (result: PredictResponse, model: PredictionModel) => void;
}

export default function PredictionForm({
  initialValues,
  onPredicted,
}: PredictionFormProps = {}) {
  const [model, setModel] = useState<PredictionModel>("A");
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initialValues });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset form fields when initialValues change (cow selection changes)
  useEffect(() => {
    setForm({ ...EMPTY, ...initialValues });
    setResult(null);
    setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialValues?.parity,
    initialValues?.ll,
    initialValues?.bcs,
    initialValues?.weight,
  ]);

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const isModelA = model === "A";

  const isValid = isModelA
    ? inRange(form.parity, 1, 6) &&
      inRange(form.ll, 2, 9) &&
      inRange(form.bcs, 2, 4)
    : inRange(form.ll, 2, 9) &&
      inRange(form.bcs, 2, 4) &&
      inRange(form.weight, 250, 700);

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setServerError(null);
    try {
      const res = await predict({
        model,
        ll: parseInt(form.ll),
        bcs: parseFloat(form.bcs),
        ...(isModelA ? { parity: parseInt(form.parity) } : {}),
        ...(!isModelA ? { weight: parseFloat(form.weight) } : {}),
      });
      setResult(res);
      onPredicted?.(res, model);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setForm({ ...EMPTY, ...initialValues });
    setServerError(null);
  }

  function handleModelChange(m: PredictionModel) {
    setModel(m);
    setForm({ ...EMPTY, ...initialValues });
    setResult(null);
    setServerError(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <ModelToggle value={model} onChange={handleModelChange} />

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ResultCard result={result} onReset={handleReset} />
          </motion.div>
        ) : (
          <motion.div
            key={`form-${model}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {isModelA && (
              <InputField
                label="Paritas"
                hint="ke berapa kali melahirkan"
                value={form.parity}
                onChange={set("parity")}
                min={1}
                max={6}
                integer
              />
            )}

            <InputField
              label="Bulan Laktasi"
              hint="bulan ke-berapa masa laktasi"
              value={form.ll}
              onChange={set("ll")}
              min={2}
              max={9}
              integer
              unit="bulan"
            />

            <InputField
              label="BCS (Body Condition Score)"
              hint="kondisi tubuh sapi"
              value={form.bcs}
              onChange={set("bcs")}
              min={2}
              max={4}
              step={0.25}
            />

            {!isModelA && (
              <InputField
                label="Bobot Badan"
                hint="berat sapi dalam kg"
                value={form.weight}
                onChange={set("weight")}
                min={250}
                max={700}
                unit="kg"
              />
            )}

            {serverError && (
              <p className="text-sm text-red-500 text-center">{serverError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className={`mt-1 w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] ${
                isValid && !loading
                  ? "bg-[#2d6a4f] text-white shadow-md shadow-[#2d6a4f]/30"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Menghitung..." : "Hitung Prediksi"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
