"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * 🛡️ QueryProvider
 * Wraps the Next.js App Router to enable TanStack Query (React Query).
 * This is the engine that will poll your /analyze-risk and /analytics 
 * Flask endpoints.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // We use useState to initialize the QueryClient to ensure it's 
  // singleton-per-browser-session (prevents unnecessary re-instantiations).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🕒 Data is considered "fresh" for 1 minute.
            // Good for security audits where things don't change every second.
            staleTime: 60 * 1000,
            
            // 🔄 If the Flask backend is down (500s), retry twice before failing.
            // Essential for distributed systems reliability.
            retry: 2,
            
            // 📶 Refetch data when the browser window regains focus.
            // Ensures the Manager always sees the latest 'Blast Radius' hits.
            refetchOnWindowFocus: true,
          },
          mutations: {
            // 🛡️ Fail-safe: If a toggle-flag action fails, don't retry automatically.
            // We want the user to manually intervene for security actions.
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* 🛠️ DevTools: Only visible in development mode.
         Invaluable for debugging your Flask JSON responses and cache states.
      */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}