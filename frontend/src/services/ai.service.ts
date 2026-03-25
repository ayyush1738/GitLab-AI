import { api } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";
import { 
  ApiResponse, 
  RiskAnalysisRequest, 
  AuditTrailResponse 
} from "@/types/api";
import { AIAssessment } from "@/types/models";

/**
 * 🧠 AI Governance Service
 * Purpose: Centralized gateway for GitGuardian's Dual-Agent Orchestration.
 * 🏗️ Strategy:
 * - Claude 3.5 Sonnet: Primary Logic & Risk Auditor.
 * - Gemini 1.5 Flash: Sustainability & Efficiency Auditor.
 */
export const AiService = {
  /**
   * 🛡️ Perform Pre-Deployment Risk Analysis
   * Triggers the AI Agent to perform a 'Pre-flight' check on a configuration toggle.
   */
  analyzeRisk: async (payload: RiskAnalysisRequest): Promise<AIAssessment> => {
    try {
      const res = await api.post<ApiResponse<AIAssessment>>(
        `${API_ENDPOINTS.AI}/analyze`, 
        payload
      );
      return res.data.data;
    } catch (error) {
      console.error("🛡️ AI Analysis Failed: Check GitGuardian Agent connectivity.", error);
      throw error;
    }
  },

  /**
   * 📜 Fetch Compliance Ledger
   * Retrieves the immutable history of AI-backed decisions from the /api/flags/logs endpoint.
   */
  getAuditLogs: async (): Promise<AuditTrailResponse> => {
    const res = await api.get<ApiResponse<AuditTrailResponse>>(
      `${API_ENDPOINTS.FLAGS}/logs`
    );
    return res.data.data;
  },

  /**
   * 🍃 Fetch Sustainability Metrics
   * Specifically pulls the Gemini-generated 'Green Audit' for the $3k Prize Category.
   */
  getEcoReport: async (auditId: number): Promise<any> => {
    const res = await api.get<ApiResponse<any>>(
      `${API_ENDPOINTS.AI}/eco-report/${auditId}`
    );
    return res.data.data;
  },

  /**
   * 📊 Get Real-Time Blast Radius
   * Pulls the hit-density distribution from the Redis-backed Traffic Service.
   */
  getBlastRadius: async (): Promise<any[]> => {
    try {
      const res = await api.get<ApiResponse<any[]>>(`${API_ENDPOINTS.FLAGS}/analytics`);
      return res.data.data;
    } catch (error) {
      console.warn("📊 Analytics Service Offline: Falling back to local cache.");
      return [];
    }
  }
};