"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRole?: "ADMIN" | "FARMER";
}

export default function AuthGuard({ children, allowedRole }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRole && user.role !== allowedRole) {
      router.replace(user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
    }
  }, [user, loading, allowedRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="text-[#15803d] text-sm">Memuat...</div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRole && user.role !== allowedRole) return null;

  return <>{children}</>;
}
