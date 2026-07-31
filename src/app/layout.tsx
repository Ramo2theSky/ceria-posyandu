import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1F4E4A",
};

export const metadata: Metadata = {
  title: "CERIA Posyandu - Sistem Pendataan Kesehatan",
  description: "Sistem pendataan dan skrining kesehatan digital untuk Posyandu Remaja & Lansia Desa Jurangjero",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
