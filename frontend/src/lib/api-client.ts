import axios from "axios";

/**
 * 🛰️ SafeConfig AI API Client
 * Purpose: Centralized Axios instance for communicating with the Flask backend.
 * Features: Automatic Session Sync (Cookies), 401 Interception, and CORS Handshaking.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true, // 🚀 CRITICAL: Sends Flask session cookies for Role-based Auth
  headers: {
    "Content-Type": "application/json",
    // 🛡️ Custom header for the SafeConfig Audit Agent to identify frontend requests
    "X-SafeConfig-Source": "Dashboard-v1",
  },
});

/**
 * 🚦 Response Interceptor
 * Purpose: Global error handling for unauthorized sessions.
 * Behavior: If the Flask backend returns 401 (Session Expired), bounce to /login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response?.status === 401;
    const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";

    if (isUnauthorized && !isLoginPage) {
      // 🛡️ Force re-authentication if the session cookie has expired or been revoked
      console.warn("🔐 Session Expired. Redirecting to Secure Login...");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);