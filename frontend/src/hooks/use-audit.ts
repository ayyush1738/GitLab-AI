"use client";

import { useQuery } from "@tanstack/react-query";
import { AiService } from "@/services/ai.service";
import { POLLING_INTERVALS } from "@/lib/constants";
import { AuditLog } from "@/types/models";

/**
 * 📜 useAudit Hook
 * Manages the fetching and real-time syncing of the AI Compliance Ledger.
 * * 🏗️ Strategy:
 * 1. Fetch: Pulls data from the /api/flags/logs Flask endpoint.
 * 2. Sort: Ensures 'Newest First' priority on the client side.
 * 3. Polling: Background syncs every X seconds to capture live AI decisions.
 */
export function useAudit() {
  const {
    data: logs,
    isLoading,
    isError,
    refetch,
    isFetching,
    error
  } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      try {
        const data = await AiService.getAuditLogs();
        
        if (!data) return [];

        // 🧬 Client-Side Data Transformation
        // Sorts by ISO timestamp to ensure the most critical/recent events 
        // are prioritized in the 'Compliance Ledger' table.
        return (data as AuditLog[]).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } catch (err) {
        console.error("🚨 Audit Sync Failed: Check Flask API logs.", err);
        throw err;
      }
    },
    // 🔥 Live Sync: Defined in constants.ts (default 60s for the demo)
    refetchInterval: POLLING_INTERVALS?.AUDIT_LOGS || 60000,
    
    // 📶 Telemetry Sync: Refetch when the manager switches back to the tab
    refetchOnWindowFocus: true,
    
    // 🛡️ Data Integrity: Keep "Old" data while fetching "New" to prevent UI flickering
    placeholderData: (previousData) => previousData,
  });

  return {
    logs: logs ?? [],
    isLoading,
    isError,
    error,
    isFetching,
    refreshLogs: refetch,
  };
}