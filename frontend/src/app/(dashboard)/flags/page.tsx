"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Plus, Search, ShieldCheck, Zap, Loader2, 
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

interface RiskReport {
  risk_score: number;
  summary: string;
  advice: string;
  risk_level: 'low' | 'medium' | 'high';
}

export default function FlagsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // 🛡️ Justification & Risk State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToggle, setActiveToggle] = useState<{ id: number, envId: number, key: string, envName: string } | null>(null);
  const [reason, setReason] = useState("");
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  // 🚀 Create Feature State
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

  // Handle Toggle Initiation
  const handleToggleInitiation = async (flagId: number, envId: number, key: string, envName: string) => {
    setActiveToggle({ id: flagId, envId, key, envName });
    setIsModalOpen(true);
    setReason("");

    // Trigger AI Risk Audit if Production
    if (envName.toLowerCase().includes('production')) {
      setIsAssessing(true);
      setRiskReport(null);
      try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/pre-flight`, 
          { flag_id: flagId, env_id: envId }, 
          { withCredentials: true }
        );
        setRiskReport(res.data.data.report);
      } catch (err) {
        console.error("AI Pre-flight failed. Endpoint /api/ai/pre-flight might be missing on backend.", err);
      } finally {
        setIsAssessing(false);
      }
    } else {
      setRiskReport(null);
      setIsAssessing(false);
    }
  };

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
    onError: (error: any, _newToggle, context: any) => {
      if (context?.previousFlags) {
        queryClient.setQueryData(["flags"], context.previousFlags);
      }
      const report = error.response?.data?.data?.report;
      alert(`🚫 AI Guardrail Blocked: ${report?.risk_level?.toUpperCase() || "HIGH RISK"}\nAdvice: ${report?.advice || "Consult audit logs."}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      setIsModalOpen(false);
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
          <p className="text-slate-400 mt-1 text-sm font-medium italic">Jaipur Node: AI-Powered Risk Governance.</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 rounded-xl shadow-lg shadow-indigo-500/20 px-6"
        >
          <Plus size={18} /> Define New Feature
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input 
            placeholder="Search by key (e.g. 'show_my_work')..."
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
              isPending={toggleMutation.isPending && activeToggle?.id === flag.id}
              onToggle={(envId, envName) => handleToggleInitiation(flag.id, envId, flag.key, envName)} 
            />
          ))
        )}
      </div>

      {/* 🛡️ AI Justification & Risk Interlock Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-[2.5rem] max-w-lg shadow-2xl p-8 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              {isAssessing ? <Loader2 className="text-indigo-500 animate-spin" /> : <ShieldCheck className="text-indigo-500" />}
              {isAssessing ? "AI Risk Audit..." : "Deployment Governance"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {isAssessing ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Activity className="w-12 h-12 text-indigo-500 animate-pulse" />
                <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">Analyzing Blast Radius...</p>
              </div>
            ) : riskReport ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className={cn(
                  "p-5 rounded-3xl border flex flex-col gap-3",
                  (riskReport?.risk_score ?? 0) > 7 ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Risk Score</span>
                    <Badge className={cn("px-3 py-1 rounded-full text-xs font-bold", (riskReport?.risk_score ?? 0) > 7 ? "bg-rose-500" : "bg-amber-500 text-black")}>
                      {riskReport?.risk_score ?? 0}/10
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{riskReport?.summary}</p>
                  <div className="flex items-center gap-2 mt-2 p-3 bg-black/40 rounded-2xl border border-white/5">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] text-slate-400 font-mono italic">Advice: {riskReport?.advice || "Proceed with caution."}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                <ShieldAlert size={18} className="text-indigo-500 shrink-0" />
                <p className="text-xs text-slate-400">Modifying <span className="text-white font-bold">{activeToggle?.key}</span> in <span className="text-white font-bold">{activeToggle?.envName}</span>.</p>
              </div>
            )}

            {!isAssessing && (
              <textarea 
                className="w-full h-28 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                placeholder="Reason for deployment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" className="rounded-2xl" onClick={() => setIsModalOpen(false)}>Abort</Button>
            <Button 
              className={cn("px-10 rounded-2xl font-bold", (riskReport?.risk_score ?? 0) > 7 ? "bg-rose-600 hover:bg-rose-500" : "bg-indigo-600 hover:bg-indigo-500")}
              disabled={reason.length < 5 || toggleMutation.isPending || isAssessing}
              onClick={() => toggleMutation.mutate({ id: activeToggle!.id, envId: activeToggle!.envId, reason })}
            >
              {toggleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Deploy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🚀 Create Feature Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-3xl max-w-md shadow-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl font-bold"><Zap className="text-indigo-500" /> Define New Feature</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Input placeholder="Feature Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-slate-900 border-slate-800" />
            <select className="w-full h-10 bg-slate-900 border border-slate-800 rounded-md px-3 text-sm" value={newEnv} onChange={(e) => setNewEnv(e.target.value)}>
              <option>Development</option><option>Staging</option><option>Production</option>
            </select>
            <textarea className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm" placeholder="Blast Radius..." value={newBlastRadius} onChange={(e) => setNewBlastRadius(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} className="bg-indigo-600 rounded-xl">Deploy Architecture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlagCard({ flag, onToggle, isPending }: { flag: Flag; onToggle: (envId: number, envName: string) => void; isPending: boolean }) {
  return (
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all p-8 rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col xl:flex-row justify-between gap-10 relative z-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"><ShieldCheck className="text-indigo-400 w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">{flag.name}</h3>
              <code className="text-[10px] text-indigo-500 font-mono bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 mt-1 inline-block">{flag.key}</code>
            </div>
          </div>
          <p className="text-sm text-slate-400 italic max-w-xl leading-relaxed">&quot;{flag.description || "System-monitored feature gate."}&quot;</p>
          <div className="flex gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase font-bold px-3 py-1"><Activity size={10} className="mr-2 animate-pulse" /> Redis Synced</Badge>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] uppercase font-bold px-3 py-1"><ShieldAlert size={10} className="mr-2" /> AI Audited</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-[360px]">
          <div className="flex items-center gap-2 px-1"><Server size={14} className="text-slate-600" /><span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Environment Gateways</span></div>
          <div className="grid grid-cols-3 gap-3">
            {[...flag.statuses].sort((a, b) => a.environment_id - b.environment_id).map((status) => {
              const name = status.environment_name?.toLowerCase() || "";
              const isProd = name.includes('production');
              const isStaging = name.includes('staging');
              const label = isProd ? "PROD" : isStaging ? "STAG" : "DEVE";
              return (
                <div key={`${flag.id}-${label}`} className={cn("flex flex-col items-center gap-4 p-5 rounded-3xl border transition-all hover:bg-slate-950 shadow-inner group/toggle", isProd ? "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30" : isStaging ? "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30" : "bg-slate-950/40 border-slate-800/60 hover:border-indigo-500/40")}>
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors", isProd ? "text-rose-500" : isStaging ? "text-amber-500" : "text-slate-400")}>{label}</span>
                  <button disabled={isPending} onClick={() => onToggle(status.environment_id, status.environment_name)} className={cn("w-12 h-6 rounded-full relative transition-all duration-500 flex items-center px-1 shadow-inner", status.is_enabled ? (isProd ? "bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]" : "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]") : "bg-slate-800")}><div className={cn("w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300", status.is_enabled ? "translate-x-6" : "translate-x-0", isPending && "animate-pulse opacity-50")} /></button>
                  <span className={cn("text-[8px] font-bold uppercase tracking-widest", status.is_enabled ? "text-emerald-500" : "text-slate-600")}>{status.is_enabled ? "Active" : "Locked"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-8 text-[9px] text-slate-600 border-t border-slate-800/60 pt-5 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-1.5 hover:text-amber-500 transition-colors"><Zap size={12} className="text-amber-500/50" /><span>Real-time Blast Radius Active</span></div>
        <div className="ml-auto flex items-center gap-2"><Clock size={12} /><span>LATEST SYNC: {formatDate(flag.statuses[0]?.updated_at)}</span></div>
      </div>
    </div>
  );
}