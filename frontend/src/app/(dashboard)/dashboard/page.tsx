"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Leaf, 
  Zap,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { BlastRadiusChart } from "@/components/dashboard/blast-radius-chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnalyticsItem {
  key: string;
  hits: number;
}

export default function DashboardOverview() {
  // 1. Fetch Analytics from your flag_routes.py /analytics endpoint
  const { data: analytics, isLoading, isFetching } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags/analytics`, { 
        withCredentials: true 
      });
      // Backend returns [{key: "billing", hits: 14200}, ...]
      return res.data.data as AnalyticsItem[];
    },
    refetchInterval: 15000, // Frequent polling for the "Live" demo feel
  });

  // 2. Fetch Logs to compute real pending blocks
  const { data: logs } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags/logs`, { 
        withCredentials: true 
      });
      return res.data.data as any[];
    },
    refetchInterval: 15000,
  });

  const pendingCount = logs 
    ? logs.filter((l) => (l.action && l.action.toLowerCase().includes('block')) || l.risk >= 8).length 
    : 0;


  const totalHits = analytics?.reduce((acc, curr) => acc + curr.hits, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            System Overview 
            {isFetching && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Real-time governance telemetry from <span className="text-indigo-400">Jaipur-Asia-South1</span>
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Duo Agent Status</p>
          <div className="flex items-center gap-2 justify-start md:justify-end bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <p className="text-emerald-500 font-mono text-[10px] font-bold tracking-tighter uppercase">
              Claude 3.5 & Gemini 1.5 // ACTIVE
            </p>
          </div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Blast Radius (Total)" 
          value={isLoading ? "..." : totalHits.toLocaleString()} 
          icon={<Users className="text-indigo-400 w-5 h-5" />}
          description="Global hits across all features"
          trend="+14.2%"
          trendUp={true}
        />
        <StatCard 
          title="AI Audits" 
          value="1,284" 
          icon={<ShieldAlert className="text-amber-400 w-5 h-5" />}
          description="Claude 3.5 Security Checks"
          trend="Secure"
        />
        <StatCard 
          title="Risk Index" 
          value="Medium" 
          icon={<Activity className="text-rose-400 w-5 h-5" />}
          description="Average cluster risk score"
          trend="-2.4%"
          trendUp={false}
        />
        <StatCard 
          title="Sustainability" 
          value="9.2" 
          icon={<Leaf className="text-emerald-400 w-5 h-5" />}
          description="Gemini Efficiency Rating"
          trend="+0.4"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Traffic Hotspots</h3>
              <p className="text-xs text-slate-500 mt-1">Real-time hit distribution synced with Redis</p>
            </div>
            <Button variant="outline" size="sm" className="text-[10px] h-7 border-slate-700 bg-slate-900/50 uppercase font-bold tracking-widest">
              Live Feed
            </Button>
          </div>
          
          <div className="h-[350px] w-full flex items-center justify-center">
             {isLoading ? (
               <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
             ) : (
               <BlastRadiusChart data={analytics || []} />
             )}
          </div>
        </div>

        {/* Quick Actions / Activity Feed */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden group shadow-lg shadow-indigo-500/30">
            <Zap className="absolute right-[-15px] top-[-15px] w-32 h-32 opacity-20 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-700" />
            <h4 className="font-black text-xl mb-2 tracking-tight">Manager Actions</h4>
            <p className="text-indigo-100 text-sm mb-6 relative z-10 leading-relaxed">
              You have <span className="font-bold text-white underline decoration-white/40">{pendingCount} pending</span> high-traffic overrides requiring Claude-mitigation review.
            </p>
            <Link href="/audits" className="relative z-10 w-full block">
              <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold rounded-xl transition-all active:scale-95 shadow-md">
                Review Pipeline Blocks
              </Button>
            </Link>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
            <h4 className="font-bold text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              Real-time Logs
            </h4>
            <div className="space-y-5">
              {logs && logs.length > 0 ? (
                logs.slice(0, 4).map((l: any, i: number) => {
                  const isBlocked = l.action?.toLowerCase().includes('block') || l.risk >= 8;
                  const isPassed = l.action?.toLowerCase().includes('pass') || l.action?.toLowerCase().includes('toggle');
                  let userStr = "System";
                  if (l.action?.includes('Webhook') || l.action?.includes('AI')) userStr = "GitGuardian";
                  if (l.action?.includes('MANAGER')) userStr = "Manager";
                  
                  return (
                    <LogItem 
                      key={i}
                      user={userStr} 
                      action={l.action?.replace(/_/g, ' ')} 
                      flag={l.flag_key || "system"} 
                      status={isBlocked ? "Blocked" : (isPassed ? "Success" : "Audit")} 
                      color={isBlocked ? "text-rose-500" : (isPassed ? "text-emerald-400" : "text-amber-400")} 
                    />
                  );
                })
              ) : (
                <>
                  <LogItem user="Arshad" action="Update" flag="billing_engine" status="Blocked" color="text-rose-500" />
                  <LogItem user="Ayush" action="Audit" flag="auth_gateway" status="Passed" color="text-emerald-400" />
                  <LogItem user="GitLab" action="Webhook" flag="ci_cd_gate" status="Warning" color="text-amber-400" />
                  <LogItem user="System" action="Purge" flag="redis_cache" status="Success" color="text-slate-500" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogItem({ user, action, flag, status, color }: any) {
  return (
    <div className="flex items-center justify-between text-[11px] border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <span className="text-slate-200 font-medium">
          {user} <span className="text-slate-500">invoked</span> {action}
        </span>
        <code className="text-indigo-400 font-mono text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10 w-fit">
          {flag}
        </code>
      </div>
      <span className={cn("font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50", color)}>
        {status}
      </span>
    </div>
  );
}