import { api } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";
import { 
  ApiResponse, 
  FlagCreateRequest, 
  FlagToggleRequest 
} from "@/types/api";
import { FeatureFlag } from "@/types/models";

/**
 * 🚩 Feature Flag Service
 * Purpose: Manages the lifecycle of secure configurations and environment states.
 * Integration: Directly maps to the Flask 'flags_bp' Blueprint on your Jaipur Cloud Node.
 */
export const FlagsService = {
  /**
   * 📡 Fetch All Flags
   * Retrieves flags with nested environment statuses and update history.
   * Optimized for: The 'FlagList' and 'Dashboard' overview components.
   */
  getAllFlags: async (): Promise<FeatureFlag[]> => {
    const res = await api.get<ApiResponse<FeatureFlag[]>>(API_ENDPOINTS.FLAGS);
    return res.data.data;
  },

  /**
   * 🛠️ Create New Flag
   * Registers a new feature key and initializes statuses for Dev, Staging, and Prod.
   * 🚀 Tip: Triggers the initial "Green Audit" from Gemini 1.5 during setup.
   */
  createFlag: async (payload: FlagCreateRequest): Promise<FeatureFlag> => {
    const res = await api.post<ApiResponse<FeatureFlag>>(
      API_ENDPOINTS.FLAGS, 
      payload
    );
    return res.data.data;
  },

  /**
   * 🔄 Toggle Flag Status (AI Intercepted)
   * The core of the 'GitGuardian' Governance model.
   * This PATCH request triggers the Claude 3.5 Sonnet risk assessment in the backend.
   */
  toggleStatus: async (
    flagId: number, 
    payload: FlagToggleRequest
  ): Promise<ApiResponse<any>> => {
    try {
      const res = await api.patch<ApiResponse<any>>(
        `${API_ENDPOINTS.FLAGS}/${flagId}/toggle`,
        payload
      );
      return res.data;
    } catch (error: any) {
      /**
       * 🛡️ Governance Interceptor
       * If the AI Agent returns 403, it means the change was blocked due to high risk.
       * We log the full AI reasoning report for the 'Compliance Ledger' demo.
       */
      if (error.response?.status === 403) {
        const report = error.response.data?.data?.report;
        console.warn(
          `[GitGuardian AI] Governance Block: ${error.response.data.message}`, 
          report
        );
      }
      throw error; // Rethrow to trigger the 'onError' rollback in useFlags
    }
  },

  /**
   * 🗑️ Remove Flag
   * Deletes a feature key and cascades deletion to all environment statuses.
   * Securely wipes associated Redis cache keys for the flag.
   */
  deleteFlag: async (flagId: number): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.FLAGS}/${flagId}`);
  }
};