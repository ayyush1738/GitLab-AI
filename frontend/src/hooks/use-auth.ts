"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: "manager" | "developer";
  avatar_url?: string;
}

interface AuthResponse {
  logged_in: boolean;
  user?: UserProfile;
}

/**
 * 🔐 useAuth Hook
 * Purpose: Synchronizes the Next.js client state with the Flask-Dance session.
 * Features: Role-based helpers and automatic session cleanup on logout.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // 🔄 Query: Fetch Current Session Identity
  const { data, isLoading, isError, refetch } = useQuery<AuthResponse>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true, // 🚀 Essential for cookie-based session tracking
        });
        return res.data;
      } catch (err) {
        return { logged_in: false };
      }
    },
    // Identity is relatively static; check every 5 mins or on window focus
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // 🚪 Mutation: Secure Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.get(`${API_URL}/auth/logout`, { withCredentials: true });
    },
    onSuccess: () => {
      // Clear all cached data to prevent data leakage between sessions
      queryClient.clear();
      router.push("/");
    },
  });

  return {
    user: data?.user || null,
    isLoggedIn: !!data?.logged_in,
    isLoading,
    isError,
    
    // 🛡️ Governance Helpers
    isManager: data?.user?.role === "manager",
    isDeveloper: data?.user?.role === "developer",
    
    // Actions
    logout: () => logoutMutation.mutate(),
    refreshSession: refetch,
    isLoggingOut: logoutMutation.isPending,
  };
}