import { create } from "zustand";
import { User } from "@/types/models";
import { USER_ROLES } from "@/lib/constants";

/**
 * 👤 SafeConfig User Store
 * Manages the authenticated user session and role-based permissions.
 */
interface UserState {
  // --- State ---
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // --- Computed Helpers ---
  isManager: () => boolean;
  isDeveloper: () => boolean;

  // --- Actions ---
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  // --- Initial State ---
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // --- Computed Helpers ---
  /** Returns true if the logged-in user has the 'manager' role */
  isManager: () => get().user?.role === USER_ROLES.MANAGER,

  /** Returns true if the logged-in user has the 'developer' role */
  isDeveloper: () => get().user?.role === USER_ROLES.DEVELOPER,

  // --- Actions ---
  setUser: (user) => 
    set({ 
      user, 
      isAuthenticated: !!user, 
      isLoading: false 
    }),

  setLoading: (loading) => 
    set({ isLoading: loading }),

  logout: () => 
    set({ 
      user: null, 
      isAuthenticated: false, 
      isLoading: false 
    }),
}));