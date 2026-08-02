import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1F4E4A",
};

export const metadata: Metadata = {
  title: "CERIA Posyandu - Sistem Pendataan Kesehatan",
  description: "Sistem pendataan dan skrining kesehatan digital untuk Posyandu Remaja & Lansia",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
