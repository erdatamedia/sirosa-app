"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Beef,
  Users,
  Calculator,
  Droplets,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MENU_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ternak", label: "Data Ternak", icon: Beef },
  { href: "/admin/peternak", label: "Data Peternak", icon: Users },
  { href: "/admin/prediksi", label: "Prediksi", icon: Calculator },
  { href: "/admin/produksi", label: "Produksi Susu", icon: Droplets },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#15803d] text-white transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        } min-h-screen relative z-20`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-2 px-4 py-5 border-b border-[#16a34a] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className="text-2xl flex-shrink-0">🐄</span>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">SIROSA</span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl mb-1 transition ${
                  active
                    ? "bg-white/20 font-semibold"
                    : "hover:bg-white/10"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`flex items-center gap-2 px-4 py-3 mx-2 mb-2 rounded-xl hover:bg-white/10 transition text-white/80 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span className="text-sm">Kecilkan</span>
            </>
          )}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-700">
            {MENU_ITEMS.find((m) => pathname.startsWith(m.href))?.label ?? "Admin"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:block">Keluar</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
