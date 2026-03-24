"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Plus, Search, Filter, ShieldCheck, Zap, Loader2, 
  AlertTriangle, Clock, Server, ShieldAlert, Activity 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";

// --- Types ---
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

export default function FlagsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToggle, setActiveToggle] = useState<{ id: number, envId: number, key: string } | null>(null);
  const [reason, setReason] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEnv, setNewEnv] = useState("Production");
  const [newBlastRadius, setNewBlastRadius] = useState("");

  const { data: flags, isLoading } = useQuery({
    queryKey: ["flags"],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags`, { withCredentials: true });
      return res.data.data as Flag[];
    },
  });

  // 🚀 OPTIMISTIC TOGGLE MUTATION
  const toggleMutation = useMutation({
    mutationFn: async ({ id, envId, reason }: { id: number; envId: number; reason: string }) => {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/flags/${id}/toggle`,
        { environment_id: envId, reason },
        { withCredentials: true }
      );
      return res.data;
    },
    onMutate: async (newToggle) => {
      await queryClient.cancelQueries({ queryKey: ["flags"] });
      const previousFlags = queryClient.getQueryData(["flags"]);

      queryClient.setQueryData(["flags"], (old: any) => {
        if (!old) return [];
        return old.map((f: Flag) => {
          if (f.id === newToggle.id) {
            return {
              ...f,
              statuses: f.statuses.map((s) => 
                s.environment_id === newToggle.envId ? { ...s, is_enabled: !s.is_enabled } : s
              )
            };
          }
          return f;
        });
      });

      return { previousFlags };
    },
    onError: (err, newToggle, context) => {
      queryClient.setQueryData(["flags"], context?.previousFlags);
      const report = (err as any).response?.data?.data?.report;
      alert(`🚫 AI Guardrail Blocked: ${report?.risk_level?.toUpperCase() || "HIGH RISK"}\nAdvice: ${report?.advice || "Consult audit logs."}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      setIsModalOpen(false);
      setReason("");
      setActiveToggle(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const key = newName.replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
      const description = `Target: ${newEnv} | Blast Radius: ${newBlastRadius}`;
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/flags`,
        { name: newName, key, description },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      setIsCreateModalOpen(false);
      setNewName("");
    }
  });

  const filteredFlags = flags?.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Feature Orchestrator</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium italic">Jaipur Node: Secure Governance & Multi-tier Handshake.</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 rounded-xl shadow-lg shadow-indigo-500/20 px-6"
        >
          <Plus size={18} /> Define New Feature
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input 
            placeholder="Search keys..."
            className="w-full bg-transparent border-none focus-visible:ring-0 text-slate-200 pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
            <p className="font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Secure Context...</p>
          </div>
        ) : (
          filteredFlags?.map((flag) => (
            <FlagCard 
              key={flag.id} 
              flag={flag} 
              // ✅ Corrected: Type safety for isPending
              isPending={toggleMutation.isPending && activeToggle?.id === flag.id}
              onToggle={(envId: number) => {
                setActiveToggle({ id: flag.id, envId, key: flag.key });
                setIsModalOpen(true);
              }} 
            />
          ))
        )}
      </div>

      {/* --- Justification Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-3xl max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="text-indigo-500" />
              Pre-Flight Justification
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="text-amber-500 w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Modifying <span className="font-bold text-white">{activeToggle?.key}</span>. 
                Triggers <span className="text-indigo-400 font-bold">Claude 3.5</span> risk audit.
              </p>
            </div>
            <textarea 
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Reason for change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
                className="bg-indigo-600 px-8 rounded-xl"
                disabled={reason.length < 5 || toggleMutation.isPending}
                onClick={() => toggleMutation.mutate({ id: activeToggle!.id, envId: activeToggle!.envId, reason })}
            >
                {toggleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy to Gateway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Corrected Component: FlagCard ---
function FlagCard({ flag, onToggle, isPending }: { flag: Flag; onToggle: (envId: number) => void; isPending: boolean }) {
  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all p-8 rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col xl:flex-row justify-between gap-10 relative z-10">
        
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
               <ShieldCheck className="text-indigo-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">{flag.name}</h3>
              <code className="text-[10px] text-indigo-500 font-mono bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 mt-1 inline-block">{flag.key}</code>
            </div>
          </div>
          <p className="text-sm text-slate-400 italic max-w-xl">"{flag.description}"</p>
          <div className="flex gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase font-bold px-3 py-1">
               <Activity size={10} className="mr-2 animate-pulse" /> Redis Synced
            </Badge>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] uppercase font-bold px-3 py-1">
               <ShieldAlert size={10} className="mr-2" /> AI Audited
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[360px]">
          <div className="flex items-center gap-2 px-1 mb-1">
             <Server size={14} className="text-slate-600" />
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Environment Gateways</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {flag.statuses.map((status, idx) => {
              const name = status.environment_name?.toLowerCase() || "";
              const isProd = name.includes('production') || idx === 2;
              const isStaging = name.includes('staging') || idx === 1;
              const label = isProd ? "PROD" : isStaging ? "STAG" : "DEVE";

              return (
                <div 
                  key={`${flag.id}-${label}-${idx}`} 
                  className={cn(
                    "flex flex-col items-center gap-4 p-5 rounded-3xl border transition-all hover:bg-slate-950 shadow-inner",
                    isProd ? "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30" : 
                    isStaging ? "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30" : 
                    "bg-slate-950/40 border-slate-800/60 hover:border-indigo-500/40"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    isProd ? "text-rose-500" : isStaging ? "text-amber-500" : "text-slate-400"
                  )}>
                    {label}
                  </span>
                  
                  <button 
                    disabled={isPending}
                    // ✅ Explicitly typing envId here too if needed
                    onClick={() => onToggle(status.environment_id || (idx + 1))}
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
                  <span className={cn("text-[8px] font-bold uppercase", status.is_enabled ? "text-emerald-500" : "text-slate-600")}>
                    {status.is_enabled ? "Active" : "Locked"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}