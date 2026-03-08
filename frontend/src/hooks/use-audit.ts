"use client";

import { useQuery } from "@tanstack/react-query";
import { AiService } from "@/services/ai.service";
import { POLLING_INTERVALS } from "@/lib/constants";
import { AuditLog } from "@/types/models";

/**
 * 📜 useAudit Hook
 * Manages the fetching and real-time syncing of the AI Compliance Ledger.
 * * Target: $10k Governance Category.
 * This hook ensures that every AI-blocked deployment or Manager-override 
 * is visible to authorized personnel immediately.
 */
export function useAudit() {
  const {
    data: logs,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      // Calls the centralized AiService we built
      const data = await AiService.getAuditLogs();
      
      // Sort logs by timestamp (newest first) to ensure the 
      // most recent AI decisions are at the top of the table.
      return (data as AuditLog[]).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    // Sync frequency defined in our constants (default 60s)
    refetchInterval: POLLING_INTERVALS.AUDIT_LOGS,
    // Ensure we show fresh data when the Manager switches back to the tab
    refetchOnWindowFocus: true,
  });

  return {
    logs: logs ?? [],
    isLoading,
    isError,
    isFetching,
    refreshLogs: refetch,
  };
}