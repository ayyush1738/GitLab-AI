/**
 * 🔐 Authentication & Authorization Constants
 * Purpose: Used for Role-Based Access Control (RBAC) in UI Gating.
 * Maps directly to the 'role' Enum in the Flask User model.
 */
export const USER_ROLES = {
  MANAGER: "manager",
  DEVELOPER: "developer",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * 🌍 Environment Registry
 * ID Mapping: 1 = Development, 2 = Staging, 3 = Production.
 * Used for toggling specific logic gates in the FlagCard component.
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: { id: 1, name: "Development", color: "slate" },
  STAGING: { id: 2, name: "Staging", color: "indigo" },
  PRODUCTION: { id: 3, name: "Production", color: "emerald" },
} as const;

export type EnvironmentName = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS]["name"];

/**
 * 🛡️ Security & Risk Orchestration
 * Defines the Claude 3.5 & Gemini reasoning thresholds.
 */
export const RISK_THRESHOLDS = {
  CRITICAL: 9, // Blocks all actions
  HIGH: 7,     // Requires Manager Justification
  MEDIUM: 4,   // Triggers Warning Badge
  LOW: 0,
} as const;

/**
 * 📡 API Endpoint Registry
 * Centralizes the base paths for your Flask Blueprints.
 * These map exactly to the url_prefix values in __init__.py.
 */
export const API_ENDPOINTS = {
  AUTH: "/auth",          // auth_bp → /auth/me, /auth/logout
  AI: "/api/ai",          // ai_bp   → /api/ai/analyze, /api/ai/eco-report
  FLAGS: "/api/flags",    // flags_bp → /api/flags, /api/flags/:id/toggle, /api/flags/analytics
  // ⚠️ Note: Analytics/Blast Radius data comes from /api/flags/analytics (in FLAGS).
  // There is NO separate /api/analytics route in the Flask backend.
} as const;


/**
 * 📊 UI & Brand System
 * Defines the Hex codes for the 'Command Center' aesthetic.
 */
export const COLORS = {
  RISK: {
    HIGH: "#f43f5e",    // Rose-500
    MEDIUM: "#f59e0b",  // Amber-500
    LOW: "#10b981",     // Emerald-500
  },
  BRAND: {
    PRIMARY: "#6366f1",   // Indigo-500
    SECONDARY: "#818cf8", // Indigo-400
    BACKGROUND: "#020617", // Slate-950
    SURFACE: "#0f172a",    // Slate-900
  },
} as const;

/**
 * ⏱️ Telemetry Polling Cycles (ms)
 * Configuration for TanStack Query background synchronization.
 */
export const POLLING_INTERVALS = {
  FLAGS: 30000,      // 30s for general flag state
  ANALYTICS: 15000,  // 15s for hot Redis traffic (Blast Radius)
  AUDIT_LOGS: 60000, // 60s for the immutable compliance ledger
} as const;

/**
 * 📝 System Metadata
 * Used for Global SEO and Google Cloud Prize attribution.
 */
export const APP_CONFIG = {
  NAME: "SafeConfig AI",
  VERSION: "1.0.0-PROD",
  DESCRIPTION: "AI-Orchestrated Configuration Guardrails",
  REGION: "Jaipur (IN-WEST-1)",
  ORCHESTRATOR: "Duo Agent (Claude 3.5 + Gemini 1.5)",
} as const;