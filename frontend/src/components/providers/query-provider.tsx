"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * 🛡️ QueryProvider
 * Purpose: Global state for data fetching, caching, and background synchronization.
 * Configured specifically for high-security governance auditing.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // 🚀 Initialize QueryClient as a singleton to maintain cache across navigation
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🕒 staleTime: 30s. We want the 'Blast Radius' to feel real-time 
            // but don't want to spam the Flask/Redis backend.
            staleTime: 30 * 1000,

            // ♻️ gcTime: 5 mins. Keep audit logs in memory for quick back-navigation.
            gcTime: 5 * 60 * 1000,
            
            // 🔄 Retries: Limited to 2. If the Cloud Run instance is cold-starting,
            // we give it a moment to wake up before showing an error.
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // 📶 Live Updates: Refetch when the manager switches back to the tab.
            refetchOnWindowFocus: true,

            // 🔌 Network Resilience: Refetch when internet connection is restored.
            refetchOnReconnect: true,
          },
          mutations: {
            // 🛡️ Security Fail-safe: Never auto-retry a failed 'Toggle' or 'Delete'.
            // If Claude blocks a change, we require a manual fresh attempt.
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* 🛠️ TanStack DevTools: The "X-Ray" for your AI Data.
          Visible only in development to debug JSON payloads and cache invalidation.
      */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}