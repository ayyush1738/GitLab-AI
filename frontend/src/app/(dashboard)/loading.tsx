import { Loader2, ShieldCheck } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 animate-in fade-in duration-1000">
      <div className="relative mb-6">
        <ShieldCheck className="w-16 h-16 text-indigo-500/20" />
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <h2 className="text-xl font-bold text-white tracking-tight mb-2 uppercase">GitGuardian Dashboard Sync</h2>
      <p className="font-mono text-xs tracking-widest uppercase animate-pulse">Calculating Blast Radius & Risk Metrics...</p>
    </div>
  );
}
