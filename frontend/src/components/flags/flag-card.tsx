"use client";

import { ShieldCheck, Zap, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

// Types are now imported from your models.d.ts to ensure consistency
import { FeatureFlag } from "@/types/models";

interface FlagCardProps {
  flag: FeatureFlag;
  onToggle: (envId: number) => void;
  isPending: boolean;
}

/**
 * 🚩 Flag Card Component
 * Purpose: The primary interface for toggling feature states across Dev, Staging, and Prod.
 * Features: 
 * - Multi-environment status grid.
 * - Glassmorphic design with hover-state transitions.
 * - AI Enforcement & Blast Radius indicators.
 */
export function FlagCard({ flag, onToggle, isPending }: FlagCardProps) {
  return (
    <div className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all p-6 rounded-[2rem] relative overflow-hidden backdrop-blur-md shadow-2xl">
      
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/5 rounded-full blur-[80px] group-hover:bg-indigo-600/10 transition-all duration-700" />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
        
        {/* --- Left: Information Section --- */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/10">
               <ShieldCheck className="text-indigo-400 w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                {flag.name}
              </h3>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                ID: {flag.key}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed font-medium line-clamp-2 italic">
            {flag.description || "No system description provided for AI auditing context."}
          </p>

          <div className="flex gap-2">
            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500/80 border-emerald-500/20 text-[9px] px-2 uppercase tracking-tighter">
              Redis-Synced
            </Badge>
            <Badge variant="outline" className="bg-indigo-500/5 text-indigo-400/80 border-indigo-500/20 text-[9px] px-2 uppercase tracking-tighter">
              Claude 3.5 Audited
            </Badge>
          </div>
        </div>
        
        {/* --- Right: Environment Toggle Group --- */}
        <div className="grid grid-cols-3 gap-3">
          {flag.statuses.map((status) => (
            <div 
              key={status.environment_name} 
              className="flex flex-col items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 min-w-[110px] shadow-inner transition-all hover:bg-slate-950/80 group/toggle"
            >
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover/toggle:text-slate-300 transition-colors">
                {status.environment_name}
              </span>
              
              <button 
                disabled={isPending}
                onClick={() => onToggle(status.environment_id)}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-500 flex items-center px-1 shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/40",
                  status.is_enabled 
                    ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    : "bg-slate-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300",
                  status.is_enabled ? "translate-x-6" : "translate-x-0",
                  isPending && "animate-pulse opacity-50 bg-slate-200"
                )} />
              </button>

              <div className={cn(
                "w-1 h-1 rounded-full",
                status.is_enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-700"
              )} />
            </div>
          ))}
        </div>
      </div>

      {/* --- Footer: Governance & Compliance Indicators --- */}
      <div className="mt-8 flex flex-wrap items-center gap-6 text-[9px] text-slate-600 border-t border-slate-800/40 pt-5 font-bold tracking-[0.1em] uppercase">
        <div className="flex items-center gap-1.5 hover:text-amber-500 transition-colors cursor-help">
          <Zap size={12} className="text-amber-500/50" />
          <span>Real-time Blast Radius Active</span>
        </div>
        
        <div className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors cursor-help">
          <ShieldAlert size={12} className="text-indigo-500/50" />
          <span>Governance Override Enabled</span>
        </div>

        <div className="xl:ml-auto flex items-center gap-2 text-slate-500 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800/50">
          <Clock size={11} className="text-slate-600" />
          <span className="font-mono">
            SYNCED: {formatDate(flag.statuses[0]?.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}