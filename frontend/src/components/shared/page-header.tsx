"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

/**
 * 🛰️ PageHeader
 * Purpose: Standardizes the 'Hero' area for Dashboard, Flags, and Audit pages.
 * Features: Responsive flex-row layout and high-contrast typography.
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
            {title}
          </h1>
          {/* Subtle Accent Line */}
          <div className="h-1 w-12 bg-gradient-to-r from-indigo-600 to-transparent rounded-full" />
        </div>
        
        <p className="text-slate-500 text-sm md:text-base max-w-2xl font-medium leading-relaxed italic">
          {description}
        </p>
      </div>

      {/* --- Slot for Actions (Buttons, Search Bars, etc.) --- */}
      <div className="flex items-center gap-3 shrink-0">
        {children}
      </div>
    </div>
  );
}