import { create } from "zustand";
import { User } from "@/types/models";
import { USER_ROLES, UserRole } from "@/lib/constants";

/**
 * 👤 GitGuardian User Store
 * Purpose: Manages the 'Live' session state and role-based gating logic.
 * Integration: Populated by the useAuth hook after a successful Flask-Dance handshake.
 */
interface UserState {
  // --- State ---
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // --- Actions ---
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // --- Permission Helpers (Computed) ---
  isManager: () => boolean;
  isDeveloper: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useUserStore = create<UserState>()((set, get) => ({
  // --- Initial State ---
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // --- Actions ---
  setUser: (user) => 
    set({ 
      user, 
      isAuthenticated: !!user, 
      isLoading: false 
    }),

  setLoading: (loading) => 
    set({ isLoading: loading }),

  /**
   * 🚪 Logout Action
   * Clears the local state. Note: Actual session destruction 
   * happens in the useAuth hook's logout mutation via Flask /auth/logout.
   */
  logout: () => 
    set({ 
      user: null, 
      isAuthenticated: false, 
      isLoading: false 
    }),

  // --- Permission Logic ---
  isManager: () => get().user?.role === USER_ROLES.MANAGER,

  isDeveloper: () => get().user?.role === USER_ROLES.DEVELOPER,

  /** Generic role check for scalability */
  hasRole: (role: UserRole) => get().user?.role === role,
}));