"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlagsService } from "@/services/flags.service";
import { POLLING_INTERVALS } from "@/lib/constants";
import { FeatureFlag } from "@/types/models"; 

/**
 * 🚩 useFlags Hook
 * Purpose: Central orchestrator for Feature Flag lifecycle and AI-governed state changes.
 * Features: 
 * - Zero-latency Optimistic UI.
 * - Automatic AI-Block Rollback (Claude 3.5 Sonnet).
 * - Multi-query cache invalidation (Analytics + Audits).
 */
export function useFlags() {
  const queryClient = useQueryClient();

  // 1. 📡 Fetch System Configurations
  const { data: flags, isLoading, error } = useQuery({
    queryKey: ["flags"],
    queryFn: () => FlagsService.getAllFlags(),
    // Keep local state fresh with metrics every 30s
    refetchInterval: POLLING_INTERVALS?.FLAGS || 30000,
    refetchOnWindowFocus: true,
  });

  // 2. 🧠 AI-Guarded Mutation Logic
  const toggleFlagMutation = useMutation({
    mutationFn: async ({ 
      flagId, 
      envId, 
      reason 
    }: { 
      flagId: number; 
      envId: number; 
      reason: string 
    }) => {
      // Orchestrates the Flask PATCH call which triggers the AI audit
      return FlagsService.toggleStatus(flagId, { 
        environment_id: envId, 
        reason 
      });
    },

    /**
     * 🚀 Step 1: Optimistic Handshake
     * Flips the switch in the UI immediately for that "Jaipur Edge" speed.
     */
    onMutate: async (variables) => {
      // Cancel outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["flags"] });

      // Snapshot the current cache for potential rollback
      const previousFlags = queryClient.getQueryData<FeatureFlag[]>(["flags"]);

      // Perform the local state update
      queryClient.setQueryData<FeatureFlag[]>(["flags"], (old) => {
        if (!old) return [];
        return old.map((flag) => {
          if (flag.id === variables.flagId) {
            return {
              ...flag,
              statuses: flag.statuses.map((status) => {
                // Precise check against the environment_id passed from the UI
                if (status.environment_id === variables.envId) {
                  return { ...status, is_enabled: !status.is_enabled };
                }
                return status;
              }),
            };
          }
          return flag;
        });
      });

      return { previousFlags };
    },

    /**
     * 🛡️ Step 2: AI Guardrail Rollback
     * Revert state if the Audit Agent (Claude) blocks the deployment (403).
     */
    onError: (err: any, _variables, context) => {
      if (context?.previousFlags) {
        queryClient.setQueryData(["flags"], context.previousFlags);
      }
      
      const report = err.response?.data?.data?.report;
      const message = err.response?.data?.message || "AI Guardrail Blocked Action";
      
      // Detailed console warning for your demo's "Security Trace"
      console.warn(`[SafeConfig AI] Governance Reversion: ${message}`, report);
    },

    /**
     * 🔄 Step 3: Global Invalidation
     * Syncs all dashboard modules (Charts, Logs, Flags) once the server confirms.
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });

  return {
    flags: flags ?? [],
    isLoading,
    error,
    toggleFlag: toggleFlagMutation.mutate,
    isToggling: toggleFlagMutation.isPending,
  };
}