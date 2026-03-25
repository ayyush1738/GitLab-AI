import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/context/AuthContext"; // 🚀 Essential for Session Sync

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitGuardian AI | Secure Governance Guardrails",
  description: "Enterprise-grade AI configuration auditing with real-time blast radius tracking. Optimized for Google Cloud Run.",
  icons: {
    icon: "/favicon.ico", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "min-h-screen bg-[#020617] font-sans antialiased text-slate-200"
        )}
      >
        {/* 🏰 THE PROVIDER HIERARCHY:
          1. AuthProvider: Manages the Flask Session & User Roles.
          2. QueryProvider: Handles AI Audit data fetching & Redis polling.
        */}
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}