import AuthGuard from "@/components/AuthGuard";
import FarmerLayout from "@/components/layouts/FarmerLayout";

export default function FarmerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRole="FARMER">
      <FarmerLayout>{children}</FarmerLayout>
    </AuthGuard>
  );
}
