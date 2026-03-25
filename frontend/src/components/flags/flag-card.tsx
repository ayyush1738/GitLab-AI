"use client";

import { Activity, Clock, Server, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

/**
 * 🚩 GitGuardian Flag Card Component
 * Purpose: Displays the status of a feature flag across multiple environments.
 * Features: 
 * - Environment-specific toggling with AI-ready audit hooks.
 * - Real-time "Redis Synced" and "AI Audited" status badges.
 * - Staggered layout for high-density governance control.
 */
interface FlagStatus {
  environment_id: number;
  environment_name: string;
  is_enabled: boolean;
  updated_at: string;
}

interface Flag {
  id: number;
  name: string;
  key: string;
  description: string;
  statuses: FlagStatus[];
}

interface FlagCardProps {
  flag: Flag;
  onToggle: (envId: number, envName: string) => void;
  isPending: boolean;
}

export function FlagCard({ flag, onToggle, isPending }: FlagCardProps) {
  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all p-8 rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col xl:flex-row justify-between gap-10 relative z-10">
        
        {/* --- Left: Meta Information --- */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <ShieldCheck className="text-indigo-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">
                {flag.name}
              </h3>
              <code className="text-[10px] text-indigo-500 font-mono bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 mt-1 inline-block">
                {flag.key}
              </code>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 italic max-w-xl leading-relaxed">
            &quot;{flag.description || "GitGuardian AI monitored feature gate."}&quot;
          </p>
          
          <div className="flex gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase font-bold px-3 py-1">
              <Activity size={10} className="mr-2 animate-pulse" /> Redis Synced
            </Badge>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] uppercase font-bold px-3 py-1">
              <ShieldAlert size={10} className="mr-2" /> AI Audited
            </Badge>
          </div>
        </div>

        {/* --- Right: Environment Handshakes --- */}
        <div className="flex flex-col gap-4 min-w-[360px]">
          <div className="flex items-center gap-2 px-1">
            <Server size={14} className="text-slate-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
              Environment Gateways
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[...flag.statuses]
              .sort((a, b) => a.environment_id - b.environment_id)
              .map((status) => {
                const name = status.environment_name?.toLowerCase() || "";
                const isProd = name.includes('production') || status.environment_id === 3;
                const isStaging = name.includes('staging') || status.environment_id === 2;
                const label = isProd ? "PROD" : isStaging ? "STAG" : "DEVE";

                return (
                  <div 
                    key={`${flag.id}-${label}`} 
                    className={cn(
                      "flex flex-col items-center gap-4 p-5 rounded-3xl border transition-all hover:bg-slate-950 shadow-inner group/toggle",
                      isProd ? "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30" : 
                      isStaging ? "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30" : 
                      "bg-slate-950/40 border-slate-800/60 hover:border-indigo-500/40"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                      isProd ? "text-rose-500" : isStaging ? "text-amber-500" : "text-slate-400"
                    )}>
                      {label}
                    </span>
                    
                    <button 
                      disabled={isPending}
                      onClick={() => onToggle(status.environment_id, status.environment_name)}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-all duration-500 flex items-center px-1 shadow-inner",
                        status.is_enabled 
                          ? (isProd ? "bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]" : "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]") 
                          : "bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300",
                        status.is_enabled ? "translate-x-6" : "translate-x-0",
                        isPending && "animate-pulse opacity-50"
                      )} />
                    </button>
                    
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-widest",
                      status.is_enabled ? "text-emerald-500" : "text-slate-600"
                    )}>
                      {status.is_enabled ? "Active" : "Locked"}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* --- Footer Metrics --- */}
      <div className="mt-8 flex items-center gap-8 text-[9px] text-slate-600 border-t border-slate-800/60 pt-5 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-1.5 hover:text-amber-500 transition-colors cursor-help">
          <Zap size={12} className="text-amber-500/50" />
          <span>Real-time Blast Radius Active</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Clock size={12} />
          <span>LATEST SYNC: {formatDate(flag.statuses[0]?.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}