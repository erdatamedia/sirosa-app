import AuthGuard from "@/components/AuthGuard";
import AdminLayout from "@/components/layouts/AdminLayout";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRole="ADMIN">
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  );
}
