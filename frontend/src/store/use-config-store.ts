import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserRole, ENVIRONMENTS } from "@/lib/constants";

/**
 * 🎛️ SafeConfig Global Store
 * Purpose: Manages non-sensitive UI state and layout preferences.
 * Security: Persists only layout data; roles/auth are handled by useAuth hook.
 */
interface ConfigState {
  // --- UI State ---
  isSidebarOpen: boolean;
  activeEnvironment: string;
  hasHydrated: boolean; // 🚀 Prevents Next.js Hydration Mismatch
  
  // --- User Context (Synced from useAuth) ---
  userRole: UserRole | null;
  lastAuditViewed: number | null;

  // --- Actions ---
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setEnvironment: (env: string) => void;
  setUserRole: (role: UserRole | null) => void;
  setLastAuditViewed: (id: number) => void;
  setHasHydrated: (state: boolean) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      // --- Initial State ---
      isSidebarOpen: true,
      activeEnvironment: ENVIRONMENTS.PRODUCTION.name,
      userRole: null,
      lastAuditViewed: null,
      hasHydrated: false,

      // --- Actions ---
      toggleSidebar: () => 
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        
      setSidebar: (open) => 
        set({ isSidebarOpen: open }),

      setEnvironment: (env) => 
        set({ activeEnvironment: env }),

      setUserRole: (role) => 
        set({ userRole: role }),

      setLastAuditViewed: (id) => 
        set({ lastAuditViewed: id }),

      setHasHydrated: (state) => 
        set({ hasHydrated: state }),

      resetConfig: () => 
        set({ 
          isSidebarOpen: true, 
          activeEnvironment: ENVIRONMENTS.PRODUCTION.name, 
          userRole: null 
        }),
    }),
    {
      name: "safeconfig-ui-cache",
      storage: createJSONStorage(() => localStorage),
      
      // 🛡️ Partialization Logic:
      // Only persist layout preferences. 
      // UserRole and Audit IDs should be fresh per session for security.
      partialize: (state) => ({ 
        isSidebarOpen: state.isSidebarOpen,
        activeEnvironment: state.activeEnvironment 
      }),
      
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);