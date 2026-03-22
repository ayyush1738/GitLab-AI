import { AIAssessment, AuditLog, FeatureFlag, TrafficStats, User } from "./models";

/**
 * 🛰️ Global API Response Wrapper
 * Matches the 'api_response' helper in your Flask backend.
 * Provides a consistent envelope for all 200, 403, and 500 status codes.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string; // ISO-8601 string from Python datetime.now()
}

/**
 * 🔑 Authentication Identity
 * Used by useAuth.ts to handle the GitHub/GitLab SSO session.
 */
export interface AuthMeResponse {
  logged_in: boolean;
  user?: User;
}

/**
 * 🚩 Feature Flag Orchestration
 * toggle_status() requires a justification string for the AI Audit Trail.
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
 * 🧠 AI & Risk Orchestration
 * Used to trigger a 'Pre-flight' check before a manual override or new flag.
 */
export interface RiskAnalysisRequest {
  feature_key: string;
  environment?: string;
  code_diff?: string;
  description?: string;
}

/**
 * 🛡️ AI Guardrail Rejection (403 Forbidden)
 * This structure is returned when the Claude 3.5 Agent blocks a change.
 * It contains the full reasoning for the $10,000 Governance Category.
 */
export interface AiBlockError {
  message: string;
  data: {
    report: AIAssessment;
    blocked_by: "SafeConfig_Agent_v1";
  }
}

/**
 * 📈 Analytics & Telemetry
 * Real-time hit distribution from the Redis-backed traffic service.
 */
export type TrafficAnalyticsResponse = TrafficStats[];

/**
 * 📜 Audit Trail & Compliance Ledger
 * The history of AI-audited decisions and manual manager overrides.
 */
export type AuditTrailResponse = AuditLog[];