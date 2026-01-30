import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./context/ToastContext";
import { AppProvider } from "./context/AppContext";
import { FarmProvider } from "./context/FarmContext";
import { AuthProvider } from "./context/AuthContext";
import NextAuthProvider from "./providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "LeleFarm - Manajemen Peternakan Lele",
  description: "Aplikasi SaaS untuk manajemen peternakan lele modern",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <AuthProvider>
            <FarmProvider>
              <ToastProvider>
                <AppProvider>
                  {children}
                </AppProvider>
              </ToastProvider>
            </FarmProvider>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}



