/**
 * 🔐 Authentication & Authorization Constants
 * Matches the 'role' column in your PostgreSQL 'users' table.
 */
export const USER_ROLES = {
  MANAGER: "manager",
  DEVELOPER: "developer",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * 🌍 Environment Constants
 * Matches the 'name' column in your 'environments' table initialized in index.py.
 */
export const ENVIRONMENTS = {
  PRODUCTION: "Production",
  STAGING: "Staging",
  DEVELOPMENT: "Development",
} as const;

export type EnvironmentName = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

/**
 * 🛡️ Security & Risk Constants
 * Defines the thresholds used by the AI Guardrail logic.
 */
export const RISK_THRESHOLDS = {
  HIGH: 8,    // Triggers MANAGER_OVERRIDE block
  MEDIUM: 5,  // Triggers WARNING status
  LOW: 0,
} as const;

/**
 * 📡 API Endpoint Configuration
 * Centralizes the base paths for your Flask Blueprints.
 */
export const API_ENDPOINTS = {
  AUTH: "/auth",
  AI: "/api/ai",
  FLAGS: "/api/flags",
} as const;

/**
 * 📊 UI & Charting Constants
 * Defines the brand colors used for the Blast Radius and Risk metrics.
 */
export const COLORS = {
  RISK: {
    HIGH: "#ef4444",    // Red-500
    MEDIUM: "#f59e0b",  // Amber-500
    LOW: "#10b981",     // Emerald-500
  },
  BRAND: {
    PRIMARY: "#4f46e5", // Indigo-600
    SECONDARY: "#818cf8", // Indigo-400
    DARK: "#020617",    // Slate-950
  },
} as const;

/**
 * ⏱️ Polling & Timeout Constants
 * Configuration for TanStack Query intervals.
 */
export const POLLING_INTERVALS = {
  ANALYTICS: 30000, // 30 seconds for Redis traffic sync
  AUDIT_LOGS: 60000, // 1 minute for the compliance ledger
} as const;

/**
 * 📝 Metadata Constants
 * Used for the SEO and Head tags in layout.tsx.
 */
export const APP_CONFIG = {
  NAME: "SafeConfig AI",
  DESCRIPTION: "Enterprise AI Guardrails for Distributed Configurations",
  REGION: "Jaipur (IN-WEST)",
} as const;