import { UserRole, EnvironmentName } from "@/lib/constants";

/**
 * 👤 User Identity
 * Maps to 'users' table. Used for RBAC checks in the UI.
 */
export interface User {
  id: number;
  email: string;
  role: UserRole; // 'manager' | 'developer'
  created_at: string;
}

/**
 * 🌍 Deployment Environment
 * Maps to 'environments' table initialized in index.py
 */
export interface Environment {
  id: number;
  name: EnvironmentName;
}

/**
 * 🚩 Feature Flag Core
 * Includes nested statuses for all environments.
 */
export interface FeatureFlag {
  id: number;
  name: string;
  key: string;
  description: string;
  statuses: FlagStatus[];
}

/**
 * ⚡ Flag Status per Environment
 */
export interface FlagStatus {
  environment_name: string;
  is_enabled: boolean;
  updated_at: string;
}

/**
 * 🛡️ AI Risk Assessment Report
 * Maps to the JSONB output from SafeConfigAgent.run_audit()
 */
export interface AIAssessment {
  risk_score: number; // 1-10 scale
  risk_level: "low" | "medium" | "high";
  advice: string;
  status: "PASSED" | "BLOCKED" | "WARNING";
  requires_override: boolean;
  triggered_by: string;
  blast_radius_hits: number;
  sustainability_audit?: SustainabilityReport;
}

/**
 * 🍃 Green Audit (Gemini 1.5 Flash)
 */
export interface SustainabilityReport {
  score: number;
  warnings: string[];
  green_advice: string;
}

/**
 * 📜 Compliance Ledger Entry
 * Essential for the $10k Prize Category (Governance & Audit)
 */
export interface AuditLog {
  id: number;
  flag_id?: number;
  env_name: string;
  action: string; 
  reason: string;
  ai_report: AIAssessment | null;
  timestamp: string;
}

/**
 * 📊 Traffic Telemetry
 * Real-time data from Redis
 */
export interface TrafficStats {
  key: string; 
  hit_count: number;
}