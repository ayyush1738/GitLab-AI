"use client";

import { FlagCard } from "./flag-card";
import { LoadingState } from "@/components/shared/loading-state";
import { ShieldAlert, PlusCircle, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Local Interfaces ---
interface Flag {
  id: number;
  name: string;
  key: string;
  description: string;
  statuses: any[];
}

interface FlagListProps {
  flags: Flag[] | undefined;
  isLoading: boolean;
  searchQuery: string;
  onOpenCreateModal: () => void;
  // 🛡️ SafeConfig Governance: Strict typing for the toggle handshake
  onToggleRequest: (flagId: number, envId: number, key: string) => void;
  isToggling: boolean;
}

/**
 * 🗂️ Flag List Grid
 * Purpose: Dynamically renders the AI-guarded feature gates with staggered entrance animations.
 */
export function FlagList({ 
  flags, 
  isLoading, 
  searchQuery, 
  onOpenCreateModal,
  onToggleRequest,
  isToggling 
}: FlagListProps) {

  // 🔍 Search Logic: Filters by Name or Key
  const filteredFlags = flags?.filter((flag) =>
    flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🌀 Loading State: Visual feedback for Jaipur Cloud Node synchronization
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center w-full">
        <LoadingState message="Synchronizing AI-guarded features from Jaipur Cloud Node..." />
      </div>
    );
  }

  // 🏜️ Global Empty State: No flags exist in the database
  if (!flags || flags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem] text-center px-6 animate-in fade-in zoom-in duration-500 w-full">
        <div className="bg-indigo-500/10 p-4 rounded-full mb-6">
          <ShieldAlert className="w-10 h-10 text-indigo-500/50" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Feature Gates Detected</h3>
        <p className="text-sm text-slate-500 max-w-xs mb-8">
          Your secure governance environment is ready, but no feature logic has been initialized yet.
        </p>
        <Button 
          onClick={onOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest px-8 rounded-xl h-12 gap-2 transition-all hover:scale-105"
        >
          <PlusCircle size={18} /> Initialize First Flag
        </Button>
      </div>
    );
  }

  // 🏜️ Search Empty State: Filter returns nothing
  if (filteredFlags?.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4 w-full">
        <div className="bg-slate-800/50 p-3 rounded-2xl mb-4">
          <SearchX className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
          No matching configurations for <span className="text-indigo-400">"{searchQuery}"</span>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 w-full">
      {filteredFlags?.map((flag, index) => (
        <div 
          key={flag.id} 
          style={{ animationDelay: `${index * 80}ms` }}
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        >
          <FlagCard 
            flag={flag as any} 
            isPending={isToggling}
            // ✅ Explicit Type fix: (envId: number) resolves the 'implicitly any' error
            onToggle={(envId: number) => onToggleRequest(flag.id, envId, flag.key)} 
          />
        </div>
      ))}
    </div>
  );
}