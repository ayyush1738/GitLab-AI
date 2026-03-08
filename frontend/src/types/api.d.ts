import { AIAssessment, AuditLog, FeatureFlag, TrafficStats, User } from "./models";

/**
 * 🛰️ Global API Response Wrapper
 * Matches the 'api_response' helper in Flask.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string; // ISO string from backend
}

/**
 * 🔑 Auth Responses
 */
export interface AuthMeResponse {
  logged_in: boolean;
  user?: User;
}

/**
 * 🚩 Feature Flag Requests/Responses
 */
export interface FlagToggleRequest {
  environment_id: number;
  reason: string;
}

export interface FlagCreateRequest {
  name: string;
  key: string;
  description?: string;
}

/**
 * 🧠 AI & Risk Requests
 */
export interface RiskAnalysisRequest {
  feature_key: string;
  environment?: string;
  code_diff?: string;
  description?: string;
}

/**
 * 🛡️ AI Error/Block Response
 * Matches the data structure returned by FlagService.toggle_status 
 * when an AI Guardrail blocks a deployment.
 */
export interface AiBlockError {
  message: string;
  report: AIAssessment;
}

/**
 * 📈 Analytics Responses
 */
export type TrafficAnalyticsResponse = TrafficStats[];

/**
 * 📜 Audit Trail Responses
 */
export type AuditTrailResponse = AuditLog[];