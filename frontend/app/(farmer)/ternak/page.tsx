"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronDown, ChevronUp, Edit2, Leaf, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  type Cow,
  type CowStatus,
  type CreateCowInput,
  type UpdateCowInput,
  getCows,
  createCow,
  updateCow,
} from "@/lib/cow-api";

// ─── Status badge ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<CowStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Aktif", color: "#16a34a", bg: "#dcfce7" },
  DRY: { label: "Kering", color: "#ca8a04", bg: "#fef9c3" },
  CULLED: { label: "Afkir", color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }: { status: CowStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Validation helpers ─────────────────────────────────────────────────────
function isFormValid(f: CreateCowInput) {
  if (!f.earTag.trim()) return false;
  if (f.parity < 1 || f.parity > 6) return false;
  if (f.currentBCS !== undefined && f.currentBCS !== null && (f.currentBCS < 2 || f.currentBCS > 4))
    return false;
  if (
    f.currentWeight !== undefined &&
    f.currentWeight !== null &&
    (f.currentWeight < 200 || f.currentWeight > 800)
  )
    return false;
  if (
    f.lactationMonth !== undefined &&
    f.lactationMonth !== null &&
    (f.lactationMonth < 1 || f.lactationMonth > 12)
  )
    return false;
  return true;
}

// ─── Cow form (add / edit) ──────────────────────────────────────────────────
interface CowFormProps {
  initial?: Partial<Cow>;
  onSave: (data: CreateCowInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: string;
}

function CowForm({ initial, onSave, onCancel, saving, error }: CowFormProps) {
  const [form, setForm] = useState<CreateCowInput>({
    earTag: initial?.earTag ?? "",
    name: initial?.name ?? "",
    parity: initial?.parity ?? 1,
    currentBCS: initial?.currentBCS ?? undefined,
    currentWeight: initial?.currentWeight ?? undefined,
    lactationMonth: initial?.lactationMonth ?? undefined,
    status: initial?.status ?? "ACTIVE",
  } as CreateCowInput);

  function set<K extends keyof CreateCowInput>(key: K, val: CreateCowInput[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const valid = isFormValid(form);

  return (
    <div className="space-y-3">
      {/* Ear tag */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Ear Tag <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.earTag}
          onChange={(e) => set("earTag", e.target.value)}
          placeholder="cth. ID-001"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>

      {/* Nama */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Nama Sapi</label>
        <input
          type="text"
          value={form.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="opsional"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>

      {/* Paritas */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Paritas (1–6) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min={1}
          max={6}
          step={1}
          value={form.parity}
          onChange={(e) => set("parity", parseInt(e.target.value) || 1)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {(form.parity < 1 || form.parity > 6) && (
          <p className="text-[11px] text-red-500 mt-0.5">Paritas harus antara 1–6</p>
        )}
      </div>

      {/* BCS */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">BCS (2–4)</label>
        <input
          type="number"
          min={2}
          max={4}
          step={0.1}
          value={form.currentBCS ?? ""}
          onChange={(e) =>
            set("currentBCS", e.target.value === "" ? undefined : parseFloat(e.target.value))
          }
          placeholder="opsional"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {form.currentBCS !== undefined &&
          form.currentBCS !== null &&
          (form.currentBCS < 2 || form.currentBCS > 4) && (
            <p className="text-[11px] text-red-500 mt-0.5">BCS harus antara 2–4</p>
          )}
      </div>

      {/* Bobot badan */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Bobot Badan (kg, 200–800)</label>
        <input
          type="number"
          min={200}
          max={800}
          step={1}
          value={form.currentWeight ?? ""}
          onChange={(e) =>
            set("currentWeight", e.target.value === "" ? undefined : parseFloat(e.target.value))
          }
          placeholder="opsional"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {form.currentWeight !== undefined &&
          form.currentWeight !== null &&
          (form.currentWeight < 200 || form.currentWeight > 800) && (
            <p className="text-[11px] text-red-500 mt-0.5">Bobot harus antara 200–800 kg</p>
          )}
      </div>

      {/* Bulan laktasi */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Bulan Laktasi (1–12)</label>
        <input
          type="number"
          min={1}
          max={12}
          step={1}
          value={form.lactationMonth ?? ""}
          onChange={(e) =>
            set("lactationMonth", e.target.value === "" ? undefined : parseInt(e.target.value))
          }
          placeholder="opsional"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {form.lactationMonth !== undefined &&
          form.lactationMonth !== null &&
          (form.lactationMonth < 1 || form.lactationMonth > 12) && (
            <p className="text-[11px] text-red-500 mt-0.5">Bulan laktasi harus antara 1–12</p>
          )}
      </div>

      {/* Status */}
      {initial && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as CowStatus)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
          >
            <option value="ACTIVE">Aktif</option>
            <option value="DRY">Kering</option>
            <option value="CULLED">Afkir</option>
          </select>
        </div>
      )}

      {error && <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!valid || saving}
          className="flex-1 py-2.5 rounded-xl bg-[#16a34a] text-white text-sm font-semibold hover:bg-[#15803d] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

// ─── Cow card (expandable) ──────────────────────────────────────────────────
interface CowCardProps {
  cow: Cow;
  onEdit: (cow: Cow) => void;
}

function CowCard({ cow, onEdit }: CowCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Tag size={16} className="text-[#16a34a]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{cow.earTag}</span>
            <StatusBadge status={cow.status} />
          </div>
          {cow.name && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{cow.name}</p>
          )}
          <p className="text-[11px] text-gray-400 mt-1">
            Paritas {cow.parity}
            {cow.currentBCS != null ? ` | BCS ${cow.currentBCS.toFixed(1)}` : ""}
            {cow.lactationMonth != null ? ` | Laktasi bln ke-${cow.lactationMonth}` : ""}
          </p>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 mt-1 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 mt-1 flex-shrink-0" />
        )}
      </button>

      {/* Detail expand */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="text-gray-400">Ear Tag</div>
                <div className="font-medium text-gray-700">{cow.earTag}</div>

                <div className="text-gray-400">Nama</div>
                <div className="font-medium text-gray-700">{cow.name ?? "—"}</div>

                <div className="text-gray-400">Paritas</div>
                <div className="font-medium text-gray-700">{cow.parity}</div>

                <div className="text-gray-400">BCS</div>
                <div className="font-medium text-gray-700">
                  {cow.currentBCS != null ? cow.currentBCS.toFixed(1) : "—"}
                </div>

                <div className="text-gray-400">Bobot (kg)</div>
                <div className="font-medium text-gray-700">
                  {cow.currentWeight != null ? cow.currentWeight : "—"}
                </div>

                <div className="text-gray-400">Bulan Laktasi</div>
                <div className="font-medium text-gray-700">
                  {cow.lactationMonth != null ? cow.lactationMonth : "—"}
                </div>

                <div className="text-gray-400">Status</div>
                <div><StatusBadge status={cow.status} /></div>

                <div className="text-gray-400">Tgl Lahir</div>
                <div className="font-medium text-gray-700">
                  {cow.birthDate
                    ? new Date(cow.birthDate).toLocaleDateString("id-ID")
                    : "—"}
                </div>
              </div>

              <button
                onClick={() => onEdit(cow)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#16a34a] text-[#16a34a] text-sm font-medium hover:bg-[#f0fdf4] transition"
              >
                <Edit2 size={14} />
                Edit Data
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modal overlay ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-[430px] bg-white rounded-t-3xl px-5 pt-5 pb-8 max-h-[90vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function TernakPage() {
  const { token } = useAuth();
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Cow | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await getCows(token, statusFilter ? { status: statusFilter } : {});
      setCows(data);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  async function handleAdd(form: CreateCowInput) {
    if (!token) return;
    setSaving(true);
    setSaveError("");
    try {
      const created = await createCow(token, form);
      setCows((prev) => [created, ...prev]);
      setShowAdd(false);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(form: CreateCowInput) {
    if (!token || !editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateCow(token, editTarget.id, form);
      setCows((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditTarget(null);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Ternak Saya</h2>
        <button
          onClick={() => { setShowAdd(true); setSaveError(""); }}
          className="flex items-center gap-1 bg-[#16a34a] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#15803d] transition"
        >
          <Plus size={14} />
          Tambah Sapi
        </button>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { value: "", label: "Semua" },
          { value: "ACTIVE", label: "Aktif" },
          { value: "DRY", label: "Kering" },
          { value: "CULLED", label: "Afkir" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium transition flex-shrink-0 ${
              statusFilter === f.value
                ? "bg-[#16a34a] text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-10 text-sm text-red-500">{loadError}</div>
      ) : cows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mb-4">
            <Leaf size={32} className="text-[#16a34a]" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Belum ada data ternak</p>
          <p className="text-xs text-gray-400 max-w-[220px]">
            Tambahkan sapi pertama Anda dengan menekan tombol &quot;Tambah Sapi&quot; di atas.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.06 } },
            hidden: {},
          }}
        >
          {cows.map((cow) => (
            <motion.div
              key={cow.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.25 }}
            >
              <CowCard
                cow={cow}
                onEdit={(c) => { setEditTarget(c); setSaveError(""); }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <Modal title="Tambah Sapi" onClose={() => setShowAdd(false)}>
            <CowForm
              onSave={handleAdd}
              onCancel={() => setShowAdd(false)}
              saving={saving}
              error={saveError}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editTarget && (
          <Modal title="Edit Data Sapi" onClose={() => setEditTarget(null)}>
            <CowForm
              initial={editTarget}
              onSave={handleEdit}
              onCancel={() => setEditTarget(null)}
              saving={saving}
              error={saveError}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
