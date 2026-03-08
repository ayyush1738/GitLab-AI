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
 * Handles communication with the SafeConfig AI Agent (Claude 3.5 & Gemini 1.5).
 */
export const AiService = {
  /**
   * 🛡️ Perform Pre-Deployment Risk Analysis
   * Calls the AI Agent to simulate a 'Blast Radius' check before a flag is toggled.
   */
  analyzeRisk: async (payload: RiskAnalysisRequest): Promise<AIAssessment> => {
    const res = await api.post<ApiResponse<AIAssessment>>(
      `${API_ENDPOINTS.AI}/analyze`, 
      payload
    );
    return res.data.data;
  },

  /**
   * 📜 Fetch Compliance Ledger
   * Retrieves the full history of AI-backed decisions and manual overrides.
   */
  getAuditLogs: async (): Promise<AuditTrailResponse> => {
    const res = await api.get<ApiResponse<AuditTrailResponse>>(
      `${API_ENDPOINTS.FLAGS}/logs`
    );
    return res.data.data;
  },

  /**
   * 🍃 Fetch Sustainability Metrics
   * Specifically pulls the Gemini-generated 'Green Audit' for the $3k prize category.
   */
  getEcoReport: async (auditId: number): Promise<ApiResponse<any>> => {
    const res = await api.get<ApiResponse<any>>(
      `${API_ENDPOINTS.AI}/eco-report/${auditId}`
    );
    return res.data;
  },

  /**
   * 📊 Get Real-Time Blast Radius
   * Fetches the hit distribution across high-risk features from Redis.
   */
  getBlastRadius: async () => {
    const res = await api.get<ApiResponse<any>>(`${API_ENDPOINTS.FLAGS}/analytics`);
    return res.data.data;
  }
};