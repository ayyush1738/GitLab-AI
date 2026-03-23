"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Activity, Loader2, Server, Zap, RefreshCw, Layers } from "lucide-react";
import { BlastRadiusChart } from "@/components/dashboard/blast-radius-chart";
import { cn, formatDate } from "@/lib/utils";

interface AnalyticsItem {
  key: string;
  hits: number;
}

interface AuditLog {
  id: number;
  flag_key: string;
  env: string;
  action: string;
  risk: number;
  sustainability: number;
  timestamp: string;
}

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading: analyticsLoading, isFetching: analyticsFetching } = useQuery<AnalyticsItem[]>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags/analytics`, { withCredentials: true });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const { data: logs, isLoading: logsLoading, isFetching: logsFetching } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: async () => {
       const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags/logs`, { withCredentials: true });
       return res.data.data;
    },
    refetchInterval: 15000,
  });

  const isFetching = analyticsFetching || logsFetching;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="text-indigo-500 w-8 h-8" />
            Blast Radius Analytics
            {isFetching && <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin ml-2" />}
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Real-time system telemetry and Cloud Server distribution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-500" /> Live Routing Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-1">Cross-regional hit distribution via Redis Cache</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full flex items-center justify-center">
              {analyticsLoading ? (
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              ) : (
                <BlastRadiusChart data={analytics || []} />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 shadow-inner">
               <Zap className="w-6 h-6 text-amber-500 mb-3" />
               <p className="text-2xl font-black text-white">{analytics?.reduce((a,c) => a + c.hits, 0).toLocaleString() || 0}</p>
               <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1">Total Valid Hits</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 shadow-inner">
               <Layers className="w-6 h-6 text-emerald-500 mb-3" />
               <p className="text-2xl font-black text-white">{logs?.length || 0}</p>
               <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mt-1">Logged Actions</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl overflow-hidden flex flex-col h-full max-h-[600px]">
          <h4 className="font-bold text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-widest sticky top-0 bg-slate-900/40 backdrop-blur-lg z-10 py-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            Immutable Audit Trail
          </h4>
          
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 mt-2">
            {logsLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-slate-600 animate-spin" /></div>
            ) : !logs || logs.length === 0 ? (
               <p className="text-center text-slate-500 text-xs mt-4">No audits recorded.</p>
            ) : (
               logs.map((log) => (
                 <div key={log.id} className="flex flex-col gap-2 border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                   <div className="flex items-center justify-between">
                     <span className="text-white text-xs font-bold">{log.action}</span>
                     <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider",
                        log.risk >= 7 ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" :
                        log.risk >= 4 ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" :
                        "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                     )}>
                        Risk: {log.risk}
                     </span>
                   </div>
                   <div className="flex items-center justify-between text-[10px]">
                     <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-400/20">{log.flag_key}</code>
                     <span className="text-slate-500">{formatDate(log.timestamp)}</span>
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
