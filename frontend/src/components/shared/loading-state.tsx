"use client";

import { ShieldCheck, Loader2 } from "lucide-react";

/**
 * 🛰️ LoadingState
 * Purpose: Used for initial page hydration and AI-agent reasoning cycles.
 * Design: High-security 'Command Center' aesthetic.
 */
export function LoadingState({ message = "Securing session..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full animate-in fade-in duration-700">
      
      {/* --- Visual Icon with Pulse Glow --- */}
      <div className="relative mb-8">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
        
        <div className="relative bg-slate-900/80 p-6 rounded-[2rem] border border-indigo-500/20 shadow-2xl backdrop-blur-md">
          <ShieldCheck className="w-12 h-12 text-indigo-500" />
        </div>

        {/* Floating Spinner Overlay */}
        <div className="absolute -bottom-2 -right-2 bg-[#020617] p-2 rounded-full border border-slate-800 shadow-lg">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </div>

      {/* --- Message Section --- */}
      <div className="text-center space-y-4">
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] italic animate-pulse">
          {message}
        </p>
        
        {/* --- Infinite Progress Bar --- */}
        <div className="w-56 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
          <div className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 w-1/2 rounded-full animate-loading-slide" />
        </div>
      </div>

      {/* --- Sub-text for context --- */}
      <p className="mt-6 text-[9px] text-slate-600 font-mono uppercase tracking-widest">
        Duo Agent Sync // Jaipur-South1
      </p>
    </div>
  );
}