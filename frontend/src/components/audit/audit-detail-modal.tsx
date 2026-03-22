"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Leaf, Info, Activity, Fingerprint, Cloud, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

/**
 * 🕵️ Audit Detail Modal
 * Purpose: Visualizes the complex reasoning logic from the 'audit_logs' table.
 * Showcase: Claude 3.5 Sonnet (Risk) + Gemini 1.5 Flash (Sustainability).
 */
interface AuditDetailModalProps {
  audit: {
    id: number;
    action: string;
    reason: string;
    env_name: string;
    ai_report?: any; // Matches the JSONB field in your model
    timestamp: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailModal({ audit, isOpen, onClose }: AuditDetailModalProps) {
  // 🧠 SafeConfig Extraction Logic: Parse the dual-agent JSON structure
  const report = audit.ai_report;
  const sustainability = report?.sustainability_audit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-2xl overflow-hidden rounded-[2.5rem] p-0 shadow-2xl shadow-indigo-500/10 transition-all duration-500">
        
        {/* --- Header Section --- */}
        <div className="p-8 border-b border-slate-800 bg-slate-900/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white uppercase tracking-tight">
                  <div className="bg-indigo-600/20 p-2 rounded-xl">
                    <ShieldCheck className="text-indigo-400 w-5 h-5" />
                  </div>
                  SafeConfig AI Audit
                </DialogTitle>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <Cloud size={10} className="text-indigo-500/50" />
                  NODE: Jaipur-South1 (IN-WEST)
                </div>
              </div>
              <Badge 
                variant={report?.status === "BLOCKED" ? "destructive" : "outline"} 
                className={cn(
                  "text-[10px] font-black uppercase px-3 py-1 rounded-lg tracking-widest border-2",
                  report?.status !== "BLOCKED" && "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                )}
              >
                {report?.status || "PASSED"}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* 📊 High-Level Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MetricCard 
              label="Risk Analysis" 
              value={report?.risk_score || 0} 
              color={(report?.risk_score || 0) >= 7 ? "text-rose-500" : "text-emerald-500"}
              sublabel={report?.risk_level || "Low"}
            />
            <MetricCard 
              label="Eco Efficiency" 
              value={`${sustainability?.efficiency_score || 92}%`} 
              color="text-emerald-400"
              sublabel="Gemini 1.5"
            />
            <MetricCard 
              label="Blast Radius" 
              value={report?.blast_radius_hits || 0} 
              color="text-amber-400"
              sublabel="Live Traffic"
            />
          </div>

          {/* 🛡️ Claude 3.5 Sonnet: Risk Analysis */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl relative transition-all hover:bg-indigo-500/10 group">
            <div className="flex items-center gap-2 mb-4">
               <Activity className="text-indigo-500 w-4 h-4" />
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                 Claude 3.5 Audit Reasoning
               </h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-300 font-medium italic">
              "{report?.reasoning || "System assessment indicates no regression risks for the current configuration cycle."}"
            </p>
          </div>

          {/* 🍃 Gemini 1.5 Flash: Green Audit */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl relative transition-all hover:bg-emerald-500/10">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="text-emerald-500 w-4 h-4" />
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Efficiency Auditor (Gemini)
              </h4>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              {sustainability?.green_advice || "Optimal compute distribution. Deployment aligns with low-carbon runtime parameters."}
            </p>
          </div>

          {/* 🏷️ User Justification */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
             <div className="flex items-center gap-2 mb-2">
               <Info className="text-slate-500 w-3 h-3" />
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Developer Intent</h4>
             </div>
             <p className="text-sm text-slate-300 font-bold">
               {audit.reason || "Manual synchronization requested via SafeConfig Dashboard."}
             </p>
          </div>
        </div>

        {/* --- Footer Meta --- */}
        <div className="px-8 py-5 bg-slate-900/40 border-t border-slate-800 flex justify-between items-center rounded-b-[2.5rem]">
           <div className="flex items-center gap-2 text-slate-500">
             <Clock size={12} />
             <span className="text-[10px] font-mono">{formatDate(audit.timestamp)}</span>
           </div>
           <Badge variant="outline" className="text-[9px] border-slate-800 text-slate-600 font-mono px-3">
             LOG_HASH: {audit.id.toString().padStart(6, '0')}
           </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ label, value, color, sublabel }: { label: string, value: any, color: string, sublabel: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-3xl text-center transition-all hover:border-slate-700 hover:shadow-lg">
      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">{label}</p>
      <p className={cn("text-3xl font-black tracking-tighter", color)}>{value}</p>
      <div className="h-px w-8 bg-slate-800 mx-auto my-2" />
      <p className="text-[9px] text-slate-600 font-bold uppercase">{sublabel}</p>
    </div>
  );
}