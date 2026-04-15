"use client";

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (val: string) => void;
  min: number;
  max: number;
  step?: number;
  integer?: boolean;
  unit?: string;
  error?: string;
}

export default function InputField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  integer = false,
  unit,
  error,
}: Props) {
  const numVal = parseFloat(value);
  const isOutOfRange =
    value !== "" && !isNaN(numVal) && (numVal < min || numVal > max);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-xs text-gray-400">
          {integer ? `${min}–${max}` : `${min}–${max}`}
        </span>
      </div>

      <div className="relative">
        <input
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={integer ? 1 : step}
          className={`w-full px-4 py-3 rounded-xl border text-base bg-white transition-colors duration-150 focus:outline-none focus:ring-2 ${
            isOutOfRange || error
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-200 focus:ring-[#52b788]/40 focus:border-[#2d6a4f]"
          } ${unit ? "pr-14" : ""}`}
          placeholder={hint ?? `${min}–${max}`}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      {(isOutOfRange || error) && (
        <p className="text-xs text-red-500">
          {error ?? `Masukkan nilai antara ${min} dan ${max}`}
        </p>
      )}
    </div>
  );
}
