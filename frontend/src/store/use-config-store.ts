import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserRole } from "@/lib/constants";

/**
 * 🎛️ SafeConfig Global Store
 * Manages UI state and non-sensitive configuration persistence.
 */
interface ConfigState {
  // UI State
  isSidebarOpen: boolean;
  activeEnvironment: string;
  
  // User Context (Synced from useAuth)
  userRole: UserRole | null;
  lastAuditViewed: number | null;

  // Actions
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setEnvironment: (env: string) => void;
  setUserRole: (role: UserRole | null) => void;
  setLastAuditViewed: (id: number) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      // --- Initial State ---
      isSidebarOpen: true,
      activeEnvironment: "Production",
      userRole: null,
      lastAuditViewed: null,

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

      resetConfig: () => 
        set({ 
          isSidebarOpen: true, 
          activeEnvironment: "Production", 
          userRole: null 
        }),
    }),
    {
      name: "safeconfig-storage", // Key in LocalStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist UI layout preferences, not sensitive roles
      partialize: (state) => ({ 
        isSidebarOpen: state.isSidebarOpen,
        activeEnvironment: state.activeEnvironment 
      }),
    }
  )
);