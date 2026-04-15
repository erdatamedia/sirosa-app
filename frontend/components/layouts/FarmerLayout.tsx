"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, List, Calculator, Droplets, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/ternak", label: "Ternak", icon: List },
  { href: "/prediksi", label: "Prediksi", icon: Calculator },
  { href: "/produksi", label: "Produksi", icon: Droplets },
  { href: "/profil", label: "Profil", icon: User },
];

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex justify-center bg-[#f5f0e8]">
      <div className="w-full max-w-[430px] flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐄</span>
            <span className="text-base font-bold text-[#15803d] tracking-tight">SIROSA</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#15803d] font-semibold text-sm"
          >
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 pb-24 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-white border-t border-gray-100 safe-area-pb">
          <div className="flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition"
                >
                  <Icon
                    size={22}
                    className={active ? "text-[#16a34a]" : "text-gray-400"}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      active ? "text-[#16a34a]" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
