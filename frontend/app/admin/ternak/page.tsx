"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Trash2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  type Cow,
  type CowStatus,
  type CreateCowInput,
  type UpdateCowInput,
  getCows,
  createCow,
  updateCow,
  deleteCow,
} from "@/lib/cow-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

interface Farm {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<CowStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Aktif", color: "#16a34a", bg: "#dcfce7" },
  DRY: { label: "Kering", color: "#ca8a04", bg: "#fef9c3" },
  CULLED: { label: "Afkir", color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }: { status: CowStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Validation ─────────────────────────────────────────────────────────────
function isFormValid(f: CreateCowInput, isAdmin: boolean) {
  if (!f.earTag.trim()) return false;
  if (isAdmin && !f.farmId) return false;
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

// ─── Modal overlay ──────────────────────────────────────────────────────────
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ─── Cow form ────────────────────────────────────────────────────────────────
interface CowFormProps {
  initial?: Partial<Cow>;
  farms: Farm[];
  onSave: (data: CreateCowInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: string;
}

function CowForm({ initial, farms, onSave, onCancel, saving, error }: CowFormProps) {
  const [form, setForm] = useState<CreateCowInput>({
    earTag: initial?.earTag ?? "",
    name: initial?.name ?? "",
    parity: initial?.parity ?? 1,
    currentBCS: initial?.currentBCS ?? undefined,
    currentWeight: initial?.currentWeight ?? undefined,
    lactationMonth: initial?.lactationMonth ?? undefined,
    status: initial?.status ?? "ACTIVE",
    farmId: initial?.farmId ?? "",
  } as CreateCowInput);

  function set<K extends keyof CreateCowInput>(key: K, val: CreateCowInput[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const valid = isFormValid(form, true);

  return (
    <div className="space-y-3">
      {/* Farm */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Farm <span className="text-red-500">*</span>
        </label>
        <select
          value={form.farmId ?? ""}
          onChange={(e) => set("farmId", e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
        >
          <option value="">— Pilih farm —</option>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

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

      <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Bobot */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">BB (kg)</label>
          <input
            type="number"
            min={200}
            max={800}
            step={1}
            value={form.currentWeight ?? ""}
            onChange={(e) =>
              set("currentWeight", e.target.value === "" ? undefined : parseFloat(e.target.value))
            }
            placeholder="200–800"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>

        {/* Laktasi */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Bln Laktasi</label>
          <input
            type="number"
            min={1}
            max={12}
            step={1}
            value={form.lactationMonth ?? ""}
            onChange={(e) =>
              set("lactationMonth", e.target.value === "" ? undefined : parseInt(e.target.value))
            }
            placeholder="1–12"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
      </div>

      {/* Status */}
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

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

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

// ─── Confirm delete dialog ───────────────────────────────────────────────────
function ConfirmDelete({
  cow,
  onConfirm,
  onCancel,
  deleting,
}: {
  cow: Cow;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Tandai sapi <strong>{cow.earTag}</strong>
        {cow.name ? ` (${cow.name})` : ""} sebagai <strong>Afkir</strong>? Tindakan ini dapat
        dibatalkan dengan mengedit status sapi.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40"
        >
          {deleting ? "Memproses..." : "Ya, Afkirkan"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function AdminTernakPage() {
  const { token } = useAuth();
  const [cows, setCows] = useState<Cow[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [farmFilter, setFarmFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Cow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cow | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setLoadError("");
    try {
      const [cowData, farmData] = await Promise.all([
        getCows(token, {
          farmId: farmFilter || undefined,
          status: statusFilter || undefined,
        }),
        fetch(`${API_URL}/cows/farms/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json() as Promise<Farm[]>),
      ]);
      setCows(cowData);
      setFarms(farmData);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, farmFilter, statusFilter]);

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

  async function handleDelete() {
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      const updated = await deleteCow(token, deleteTarget.id);
      setCows((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setDeleteTarget(null);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Data Ternak</h2>
        <button
          onClick={() => { setShowAdd(true); setSaveError(""); }}
          className="flex items-center gap-1.5 bg-[#16a34a] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#15803d] transition"
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <select
            value={farmFilter}
            onChange={(e) => setFarmFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-300 cursor-pointer"
          >
            <option value="">Semua Farm</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-300 cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="DRY">Kering</option>
            <option value="CULLED">Afkir</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-sm text-red-500 py-8 text-center">{loadError}</div>
      ) : cows.length === 0 ? (
        <div className="text-sm text-gray-400 py-16 text-center">Belum ada data ternak.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Ear Tag</th>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">Farm</th>
                  <th className="px-4 py-3 text-center">Paritas</th>
                  <th className="px-4 py-3 text-center">BCS</th>
                  <th className="px-4 py-3 text-center">BB (kg)</th>
                  <th className="px-4 py-3 text-center">Laktasi</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {cows.map((cow, i) => (
                    <motion.tr
                      key={cow.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">{cow.earTag}</td>
                      <td className="px-4 py-3 text-gray-600">{cow.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{cow.farm.name}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{cow.parity}</td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {cow.currentBCS != null ? cow.currentBCS.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {cow.currentWeight != null ? cow.currentWeight : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {cow.lactationMonth != null ? cow.lactationMonth : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={cow.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => { setEditTarget(cow); setSaveError(""); }}
                            title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#16a34a] hover:bg-[#f0fdf4] transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          {cow.status !== "CULLED" && (
                            <button
                              onClick={() => setDeleteTarget(cow)}
                              title="Afkirkan"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <Modal title="Tambah Sapi" onClose={() => setShowAdd(false)}>
            <CowForm
              farms={farms}
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
              farms={farms}
              onSave={handleEdit}
              onCancel={() => setEditTarget(null)}
              saving={saving}
              error={saveError}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <Modal title="Afkirkan Sapi" onClose={() => setDeleteTarget(null)}>
            <ConfirmDelete
              cow={deleteTarget}
              onConfirm={handleDelete}
              onCancel={() => setDeleteTarget(null)}
              deleting={deleting}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
