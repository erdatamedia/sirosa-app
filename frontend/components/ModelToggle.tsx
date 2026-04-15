"use client";

import { motion } from "framer-motion";
import type { PredictionModel } from "@/lib/api";

interface Props {
  value: PredictionModel;
  onChange: (model: PredictionModel) => void;
}

const models: { id: PredictionModel; label: string; sub: string }[] = [
  { id: "A", label: "Model A", sub: "Tanpa Bobot Badan" },
  { id: "B", label: "Model B", sub: "Dengan Bobot Badan" },
];

export default function ModelToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      {models.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className="relative flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none"
        >
          {value === m.id && (
            <motion.div
              layoutId="model-pill"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative flex flex-col items-center gap-0.5 ${
              value === m.id ? "text-[#2d6a4f]" : "text-gray-500"
            }`}
          >
            <span className="font-semibold">{m.label}</span>
            <span className="text-[11px] font-normal">{m.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
