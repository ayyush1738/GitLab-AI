"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { API_ENDPOINTS, POLLING_INTERVALS } from "@/lib/constants";

// ✅ Pulling data models from models.d.ts
import { FeatureFlag } from "@/types/models"; 

// ✅ Pulling the API envelope from api.d.ts
import { ApiResponse } from "@/types/api"; 

/**
 * 🚩 useFlags Hook
 * Manages the lifecycle of Feature Flags and their AI-guarded toggles.
 * * Features:
 * - Optimistic UI updates for instant feedback.
 * - Automatic rollback if AI Guardrail (Claude 3.5/Gemini) returns a BLOCK.
 * - Automated refetching for real-time analytics sync.
 */
export function useFlags() {
  const queryClient = useQueryClient();

  // 1. Fetch all flags and their environment statuses
  const { data: flags, isLoading, error } = useQuery({
    queryKey: ["flags"],
    queryFn: async () => {
      // res.data is typed as ApiResponse, res.data.data is typed as FeatureFlag[]
      const res = await api.get<ApiResponse<FeatureFlag[]>>(API_ENDPOINTS.FLAGS);
      return res.data.data;
    },
    refetchInterval: POLLING_INTERVALS.AUDIT_LOGS,
  });

  // 2. Toggle Mutation with AI Guardrail Logic
  const toggleFlag = useMutation({
    mutationFn: async ({ 
      flagId, 
      envId, 
      reason 
    }: { 
      flagId: number; 
      envId: number; 
      reason: string 
    }) => {
      const res = await api.patch(`${API_ENDPOINTS.FLAGS}/${flagId}/toggle`, {
        environment_id: envId,
        reason,
      });
      return res.data;
    },

    /**
     * 🚀 Optimistic Update
     * Updates the UI immediately. If the backend fails (e.g., Risk Score >= 8),
     * the onError handler will revert the state.
     */
    onMutate: async (variables) => {
      // Cancel refetches so they don't overwrite our optimistic state
      await queryClient.cancelQueries({ queryKey: ["flags"] });

      // Snapshot previous state for rollback
      const previousFlags = queryClient.getQueryData<FeatureFlag[]>(["flags"]);

      // Update the cache immediately
      queryClient.setQueryData<FeatureFlag[]>(["flags"], (old) => {
        if (!old) return [];
        return old.map((f) => {
          if (f.id === variables.flagId) {
            return {
              ...f,
              statuses: f.statuses.map((s, idx) => 
                // Assumes environment IDs start at 1 and match array order
                (idx + 1 === variables.envId) ? { ...s, is_enabled: !s.is_enabled } : s
              ),
            };
          }
          return f;
        });
      });

      return { previousFlags };
    },

    /**
     * 🛡️ Rollback on Error
     * Triggered if the AI Agent blocks the toggle (403 Forbidden).
     */
    onError: (err: any, variables, context) => {
      if (context?.previousFlags) {
        queryClient.setQueryData(["flags"], context.previousFlags);
      }
      
      const message = err.response?.data?.message || "Deployment failed";
      const report = err.response?.data?.data?.report;
      
      // Log AI reasoning for debugging/judges
      console.warn(`[AI Guardrail] ${message} | Risk Score: ${report?.risk_score}`);
    },

    /**
     * 🔄 Final Sync
     * Ensure the UI is 100% in sync with the DB and Refresh Analytics (Blast Radius).
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  return {
    flags: flags ?? [],
    isLoading,
    error,
    toggleFlag: toggleFlag.mutate,
    isToggling: toggleFlag.isPending,
  };
}