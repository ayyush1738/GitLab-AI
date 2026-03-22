"use client";

import { LucideIcon, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * 🛰️ EmptyPlaceholder
 * Purpose: Handles 'No Data' states for Audit Logs, Flags, and Analytics.
 * Optimized for: Ensuring the dashboard looks intentional even before first-run data.
 */
export function EmptyPlaceholder({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}: EmptyPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-800/60 rounded-[3rem] bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-700">
      
      {/* --- Visual Anchor --- */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-inner">
          <Icon className="w-10 h-10 text-slate-500" />
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="text-center space-y-2 mb-8">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* --- Action CTA --- */}
      {actionLabel && (
        <Button 
          onClick={onAction} 
          variant="outline" 
          className="h-11 px-8 border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-black uppercase tracking-widest gap-2 rounded-xl transition-all active:scale-95"
        >
          <ShieldQuestion size={14} className="text-indigo-500" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}