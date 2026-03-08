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
 * Manages the lifecycle of secure configurations and environment states.
 * Integrated with the Flask FlagService and PostgreSQL.
 */
export const FlagsService = {
  /**
   * 📡 Fetch All Flags
   * Retrieves flags with nested environment statuses and update history.
   */
  getAllFlags: async (): Promise<FeatureFlag[]> => {
    const res = await api.get<ApiResponse<FeatureFlag[]>>(API_ENDPOINTS.FLAGS);
    return res.data.data;
  },

  /**
   * 🛠️ Create New Flag
   * Adds a new feature key to the system. 
   * Triggers initial environment setup in the backend.
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
   * The most critical method for the $10k Governance category.
   * This request will be audited by Claude 3.5 Sonnet on the backend.
   */
  toggleStatus: async (
    flagId: number, 
    payload: FlagToggleRequest
  ): Promise<ApiResponse<any>> => {
    // PATCH /api/flags/:id/toggle
    const res = await api.patch<ApiResponse<any>>(
      `${API_ENDPOINTS.FLAGS}/${flagId}/toggle`,
      payload
    );
    return res.data;
  },

  /**
   * 🗑️ Remove Flag
   * Securely deletes a feature key and all associated environment statuses.
   */
  deleteFlag: async (flagId: number): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.FLAGS}/${flagId}`);
  }
};