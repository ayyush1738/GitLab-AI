"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend?: string;
  trendUp?: boolean;
}

/**
 * 📊 StatCard Component
 * Purpose: Displays high-level governance telemetry (Risk, Traffic, Sustainability).
 * Features: Conditional trend styling and hover animations for the 'Grand Prize' feel.
 */
export function StatCard({ title, value, icon, description, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all group backdrop-blur-sm relative overflow-hidden shadow-xl shadow-black/20">
      
      {/* --- Header Section --- */}
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner group-hover:scale-110 group-hover:bg-slate-900 transition-all duration-300">
          {icon}
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter",
            trendUp === true 
              ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" 
              : trendUp === false 
              ? "text-rose-400 bg-rose-400/10 border-rose-400/20" 
              : "text-slate-400 bg-slate-800/50 border-slate-700/50"
          )}>
            {trendUp === true && <ArrowUpRight size={10} strokeWidth={3} />}
            {trendUp === false && <ArrowDownRight size={10} strokeWidth={3} />}
            {trendUp === undefined && <Minus size={10} strokeWidth={3} />}
            {trend}
          </div>
        )}
      </div>

      {/* --- Value Section --- */}
      <div className="space-y-1">
        <h4 className="text-3xl font-black text-white tracking-tighter leading-none">
          {value}
        </h4>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          {title}
        </p>
      </div>

      {/* --- Footer Context --- */}
      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      </div>

      {/* Subtle Bottom Glow Accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
    </div>
  );
}