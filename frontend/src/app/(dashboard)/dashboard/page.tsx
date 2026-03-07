"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Leaf, 
  Zap,
  Loader2
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { BlastRadiusChart } from "@/components/dashboard/blast-radius-chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardOverview() {
  // 1. Fetch Analytics from your flag_routes.py /analytics endpoint
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags/analytics`, { 
        withCredentials: true 
      });
      return res.data.data;
    },
    refetchInterval: 30000, // Sync with Redis every 30s
  });

  const totalHits = analytics?.reduce((acc: number, curr: any) => acc + curr.hit_count, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-slate-400 mt-1">Real-time governance telemetry from Jaipur Cloud Region.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Status</p>
          <div className="flex items-center gap-2 justify-end">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-emerald-500 font-mono text-sm">OPERATIONAL // 99.9%</p>
          </div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Traffic" 
          value={isLoading ? "..." : totalHits.toLocaleString()} 
          icon={<Users className="text-indigo-400 w-5 h-5" />}
          description="Global hits across all flags"
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard 
          title="AI Audits" 
          value="1,284" 
          icon={<ShieldAlert className="text-amber-400 w-5 h-5" />}
          description="Claude 3.5 Security Checks"
          trend="Active"
        />
        <StatCard 
          title="Blast Radius" 
          value="Medium" 
          icon={<Activity className="text-red-400 w-5 h-5" />}
          description="Average risk score"
          trend="-2.4%"
          trendUp={false}
        />
        <StatCard 
          title="Eco Score" 
          value="9.2" 
          icon={<Leaf className="text-emerald-400 w-5 h-5" />}
          description="Gemini Sustainability Audit"
          trend="+0.4"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Traffic Distribution</h3>
              <p className="text-xs text-slate-500 mt-1">Live hit-count per feature key from Redis</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8 border-slate-700">Export CSV</Button>
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
          <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden group shadow-lg shadow-indigo-500/20">
            <Zap className="absolute right-[-10px] top-[-10px] w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
            <h4 className="font-bold text-lg mb-2 italic">Manager Portal</h4>
            <p className="text-indigo-100 text-sm mb-6 relative z-10">
              You have <span className="font-bold text-white underline">3 pending</span> high-risk overrides requiring attention.
            </p>
            <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold rounded-xl relative z-10">
              Review Blocks
            </Button>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Live Guardrail Logs
            </h4>
            <div className="space-y-4">
               <LogItem user="Arshad" action="Toggle ON" flag="payment_v2" status="Blocked" color="text-red-400" />
               <LogItem user="Ayush" action="Audit" flag="auth_logic" status="Passed" color="text-emerald-400" />
               <LogItem user="GitLab" action="MR Audit" flag="api_refactor" status="Warning" color="text-amber-400" />
               <LogItem user="System" action="Purge" flag="old_metrics" status="Success" color="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogItem({ user, action, flag, status, color }: any) {
  return (
    <div className="flex items-center justify-between text-xs border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-slate-300 font-medium">
          {user} <span className="text-slate-500">triggered</span> {action}
        </span>
        <code className="text-indigo-400 font-mono text-[10px] bg-indigo-500/5 px-1 rounded w-fit">
          {flag}
        </code>
      </div>
      <span className={cn("font-bold uppercase tracking-widest text-[10px]", color)}>
        {status}
      </span>
    </div>
  );
}