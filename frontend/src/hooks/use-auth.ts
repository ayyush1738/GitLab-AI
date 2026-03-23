"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
// ✅ Use the shared api client — NOT raw axios.
// The shared client has withCredentials: true and the correct baseURL baked in.
// Using raw axios here means the logout/me calls bypass the interceptor and may
// use a different base URL, causing silent auth failures.
import { api } from "@/lib/api-client";

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

  // 🔄 Query: Fetch Current Session Identity
  const { data, isLoading, isError, refetch } = useQuery<AuthResponse>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        const res = await api.get<AuthResponse>("/auth/me");
        return res.data;
      } catch {
        return { logged_in: false };
      }
    },
    // Identity is relatively static; 5min stale time prevents re-fetching on every focus
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // 🚪 Mutation: Secure Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.get("/auth/logout");
    },
    onSuccess: () => {
      // Clear all cached data to prevent data leakage between sessions
      queryClient.clear();
      // ✅ Redirect to /login (not /) so the user can re-authenticate
      router.push("/login");
    },
    onError: () => {
      // Even if server logout fails, clear local cache and redirect
      queryClient.clear();
      router.push("/login");
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