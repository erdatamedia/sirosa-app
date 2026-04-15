import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIROSA — Sistem Informasi Produksi Susu",
  description: "Aplikasi prediksi produksi susu sapi perah berbasis regresi linier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={geist.variable}>
      <body className="min-h-screen bg-[#f5f0e8]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
