"use client";

import { ShieldCheck, Loader2 } from "lucide-react";

export function LoadingState({ message = "Securing session..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full animate-in fade-in duration-500">
      <div className="relative mb-6">
        <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20">
          <ShieldCheck className="w-10 h-10 text-indigo-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#020617] p-1 rounded-full">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      </div>
      <p className="text-slate-400 font-medium text-sm tracking-wide uppercase italic">
        {message}
      </p>
      <div className="mt-4 w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 animate-progress-loading" />
      </div>
    </div>
  );
}