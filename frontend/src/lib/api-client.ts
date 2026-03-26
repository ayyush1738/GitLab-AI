import axios from "axios";

/**
 * 🛰️ GitGuardian AI API Client
 * Purpose: Centralized Axios instance for communicating with the Flask backend.
 * Features: Automatic Session Sync (Cookies), 401 Interception, and CORS Handshaking.
 */
export const api = axios.create({
  // 🛰️ DIRECT CONNECTION: Reverting to direct backend URL for stability.
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://gitguardian-backend-1671867040.us-central1.run.app",
  
  // 🛡️ CRITICAL: Mandatory for Flask-Login/Flask-Dance cookie persistence.
  // This allows the browser to send the 'session' cookie with every request.
  withCredentials: true, 
  
  headers: {
    "Content-Type": "application/json",
    // 🏷️ Identify requests for Audit logs & Jaipur Node telemetry
    "X-GitGuardian-Source": "GitGuardian-Dashboard-v1",
  },
  // ⏱️ AI Audits can be slow; 15s timeout prevents premature cancellation
  timeout: 15000, 
});

/**
 * 🚦 Response Interceptor
 * Purpose: Global error handling for unauthorized sessions and network failures.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Network Errors (Node unreachable / CORS Block)
    if (!error.response) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "N/A";

      console.error(
        `📡 [GitGuardian AI] Node Unreachable!\n` +
        `Target: ${apiUrl}\n` +
        `Origin: ${currentOrigin}\n` +
        `Possible Cause: CORS Preflight Block or Flask is down.`
      );
      return Promise.reject(error);
    }

    // 🛑 [SAFEGUARD] Global redirect disabled to prevent loops.
    // Auth is now managed exclusively by components and AuthContext hooks.

    return Promise.reject(error);
  }
);