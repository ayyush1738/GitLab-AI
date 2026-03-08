"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, Search, Filter, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

// Types matching your app/schemas.py
interface Flag {
  id: number;
  name: string;
  key: string;
  description: string;
  statuses: {
    environment_name: string;
    is_enabled: boolean;
    updated_at: string;
  }[];
}

export default function FlagsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: flags, isLoading } = useQuery({
    queryKey: ["flags"],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags`, { withCredentials: true });
      return res.data.data as Flag[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, envId, reason }: { id: number; envId: number; reason: string }) => {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/flags/${id}/toggle`,
        { environment_id: envId, reason },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
    },
    onError: (error: any) => {
      // Professional handling of the AI Block
      const message = error.response?.data?.message || "Deployment failed";
      const report = error.response?.data?.data?.report;
      
      console.error("AI Guardrail Report:", report);
      alert(`⚠️ ${message}\n\nAI Risk Score: ${report?.risk_score || 'N/A'}`);
    }
  });

  const filteredFlags = flags?.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Feature Flags</h1>
          <p className="text-slate-400 mt-1">Orchestrating Claude 3.5 & Gemini for secure deployments.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 gap-2 rounded-xl">
          <Plus size={18} /> Define New Feature
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search by key or name..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 pl-10 text-slate-200 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400 gap-2">
          <Filter size={14} /> Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p className="animate-pulse">Fetching system configurations...</p>
          </div>
        ) : (
          filteredFlags?.map((flag) => (
            <FlagCard 
              key={flag.id} 
              flag={flag} 
              isPending={toggleMutation.isPending}
              onToggle={(envId) => {
                const reason = prompt(`Reason for toggling ${flag.key}? (Required for AI Audit)`);
                if (reason) toggleMutation.mutate({ id: flag.id, envId, reason });
              }} 
            />
          ))
        )}
      </div>
    </div>
  );
}

function FlagCard({ flag, onToggle, isPending }: { flag: Flag; onToggle: (envId: number) => void; isPending: boolean }) {
  return (
    <div className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all p-6 rounded-2xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{flag.name}</h3>
            <Badge className="bg-slate-800 text-indigo-400 border-slate-700 font-mono text-[10px]">
              {flag.key}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 max-w-xl line-clamp-2">{flag.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {flag.statuses.map((status, idx) => (
            <div key={status.environment_name} className="flex flex-col items-center gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800 min-w-[100px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status.environment_name}</span>
              <button 
                disabled={isPending}
                onClick={() => onToggle(idx + 1)}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300 disabled:opacity-50",
                  status.is_enabled ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                  status.is_enabled && "translate-x-6"
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 text-[10px] text-slate-500 border-t border-slate-800/50 pt-4">
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-amber-500" />
          <span>REAL-TIME TRAFFIC SYNC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-indigo-500" />
          <span>GOVERNANCE ACTIVE</span>
        </div>
        <div className="ml-auto italic">
          Last updated: {formatDate(flag.statuses[0]?.updated_at)}
        </div>
      </div>
    </div>
  );
}