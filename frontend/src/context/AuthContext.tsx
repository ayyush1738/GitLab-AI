"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

interface User {
  id: number;
  email: string;
  role: "manager" | "developer";
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * 🔄 Session Hydration
   * Hits the /auth/me endpoint to verify the Flask-Dance session cookie.
   * Wrapped in useCallback to ensure stable references across the app.
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/auth/me");
      if (response.data.logged_in) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      setUser(null);
      if (error.response?.status !== 401) {
        console.error("📡 GitGuardian Node unreachable. Check backend at NEXT_PUBLIC_API_URL.");
      }
    } finally {
      setIsLoading(false);
    }
  // ⚠️ No pathname/router in deps: checkAuth is a one-time mount check.
  // Route-level auth guarding is handled by the dashboard layout, not here.
  // Adding pathname here causes an /auth/me spam on every navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run hydration only on initial mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    /**
     * 🔐 The GitLab SSO Handshake Trigger
     * Redirects the browser to the Flask-Dance blueprint.
     */
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    // 🏛️ PRO-TIP: We use window.location.href because this is a full page 
    // redirect to the backend/GitLab, not a Next.js internal route.
    window.location.href = `${API_URL}/login/gitlab`;
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.get("/auth/logout");
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("🔒 Server-side logout failed. Clearing local session anyway.");
      setUser(null);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}