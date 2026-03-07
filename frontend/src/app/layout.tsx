import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeConfig AI | Secure Governance Guardrails",
  description: "Enterprise-grade AI configuration auditing with real-time blast radius tracking. Built for the Google Cloud Prize 2026.",
  icons: {
    icon: "/favicon.ico", // Ensure you have a shield or lock icon here
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        {/* We wrap children in QueryProvider so all your components 
          can access the AI risk assessment data and blast radius stats.
        */}
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}