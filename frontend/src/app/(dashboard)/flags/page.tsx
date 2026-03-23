"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, Search, Filter, ShieldCheck, Zap, Loader2, AlertTriangle, Clock } from "lucide-react";
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
  
  // 🛡️ Justification State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToggle, setActiveToggle] = useState<{ id: number, envId: number, key: string } | null>(null);
  const [reason, setReason] = useState("");

  // 🚀 Define Feature State
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
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      setIsModalOpen(false);
      setReason("");
      setActiveToggle(null);
    },
    onError: (error: any) => {
      const report = error.response?.data?.data?.report;
      const message = error.response?.data?.message || "AI Guardrail Blocked Action";
      
      // Professional logging for the demo
      console.warn("🛡️ SafeConfig Block Report:", report);
      alert(`🚫 ${message}\n\nRisk Level: ${report?.risk_level?.toUpperCase()}\nAdvice: ${report?.advice}`);
      setIsModalOpen(false);
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
      setNewBlastRadius("");
      setNewEnv("Production");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Creation Failed";
      alert(`🚫 ${message}`);
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
          <p className="text-slate-400 mt-1 text-sm font-medium">Deploy with confidence using Claude 3.5 & Gemini security gates.</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 rounded-xl shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} /> Define New Feature
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input 
            placeholder="Search by key (e.g. 'billing_engine')..."
            className="w-full bg-transparent border-none focus-visible:ring-0 text-slate-200 pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400 gap-2 hover:bg-slate-800">
          <Filter size={14} /> Filter
        </Button>
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
              onToggle={(envId) => {
                setActiveToggle({ id: flag.id, envId, key: flag.key });
                setIsModalOpen(true);
              }} 
            />
          ))
        )}
      </div>

      {/* 🛡️ AI Governance Justification Modal */}
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
                This triggers a real-time <span className="text-indigo-400">Claude 3.5</span> risk audit and 
                <span className="text-emerald-400"> Gemini</span> efficiency scan.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason for change</label>
              <textarea 
                className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g., Scaling database capacity for winter sale..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 h-10">Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-500 font-bold px-8 rounded-xl h-10 shadow-lg shadow-indigo-500/20"
              disabled={reason.length < 5 || toggleMutation.isPending}
              onClick={() => toggleMutation.mutate({ id: activeToggle!.id, envId: activeToggle!.envId, reason })}
            >
              {toggleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy to Gateway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🚀 Define New Feature Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-3xl max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Zap className="text-indigo-500" />
              Define New Feature
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Feature Name</label>
              <Input 
                className="bg-slate-900 border-slate-800 text-white focus-visible:ring-indigo-500"
                placeholder="e.g. NextGen Payment Gateway"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Environment</label>
              <select 
                className="w-full h-10 bg-slate-900 border border-slate-800 rounded-md px-3 text-sm focus:outline-none focus:border-indigo-500"
                value={newEnv}
                onChange={(e) => setNewEnv(e.target.value)}
              >
                <option>Development</option>
                <option>Staging</option>
                <option>Production</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blast Radius Description</label>
              <textarea 
                className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Describe the impacted services and fallback strategies..."
                value={newBlastRadius}
                onChange={(e) => setNewBlastRadius(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 h-10">Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-500 font-bold px-8 rounded-xl h-10 shadow-lg shadow-indigo-500/20"
              disabled={newName.length < 3 || newBlastRadius.length < 5 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Architecture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlagCard({ flag, onToggle, isPending }: { flag: Flag; onToggle: (envId: number) => void; isPending: boolean }) {
  return (
    <div className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all p-6 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
               <ShieldCheck className="text-indigo-500 w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{flag.name}</h3>
            <Badge variant="outline" className="bg-slate-800 text-indigo-300 border-slate-700 font-mono text-[9px] px-2 py-0.5">
              {flag.key}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed font-medium">{flag.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {flag.statuses.map((status, idx) => (
            <div key={status.environment_name} className="flex flex-col items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 min-w-[120px] shadow-inner transition-all hover:bg-slate-950/60">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{status.environment_name}</span>
              <button 
                disabled={isPending}
                onClick={() => onToggle(idx + 1)}
                className={cn(
                  "w-14 h-7 rounded-full relative transition-all duration-500 flex items-center px-1 shadow-inner",
                  status.is_enabled ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-700"
                )}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300",
                  status.is_enabled ? "translate-x-7" : "translate-x-0",
                  isPending && "animate-pulse opacity-50"
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-8 text-[9px] text-slate-600 border-t border-slate-800/50 pt-4 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-1.5 group-hover:text-amber-500 transition-colors">
          <Zap size={12} className="text-amber-500/50 group-hover:text-amber-500" />
          <span>Blast Radius Analysis</span>
        </div>
        <div className="flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
          <ShieldCheck size={12} className="text-indigo-500/50 group-hover:text-indigo-500" />
          <span>AI Enforcement Active</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-slate-500">
          <Clock size={12} />
          {formatDate(flag.statuses[0]?.updated_at)}
        </div>
      </div>
    </div>
  );
}