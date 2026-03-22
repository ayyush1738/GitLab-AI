"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

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

// Configure Axios defaults for the entire app
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
axios.defaults.withCredentials = true; // 🚀 CRITICAL: Sends Flask session cookies

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * 🔄 Session Hydration
   * Hits the /auth/me endpoint to see if a GitHub session exists.
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`);
      
      if (response.data.logged_in) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
      console.error("Auth check failed: User is unauthenticated.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run on initial mount
  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    // Redirect to the Flask-Dance trigger we built in auth_routes.py
    window.location.href = `${API_URL}/auth/login`;
  };

  const logout = async () => {
    try {
      await axios.get(`${API_URL}/auth/logout`);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
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