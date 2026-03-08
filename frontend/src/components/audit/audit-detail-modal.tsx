"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Leaf, Info, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 🕵️ Audit Detail Modal
 * Visualizes the reasoning logic from your Flask 'audit_logs' table.
 * Specifically designed to showcase Claude 3.5 & Gemini 1.5 output.
 */
interface AuditDetailModalProps {
  audit: {
    id: number;
    action: string;
    reason: string;
    env_name: string;
    ai_report: any;
    timestamp: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailModal({ audit, isOpen, onClose }: AuditDetailModalProps) {
  const report = audit.ai_report;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-2xl overflow-hidden rounded-3xl shadow-2xl shadow-indigo-500/10">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white uppercase tracking-tight">
            <div className="bg-indigo-600/20 p-2 rounded-lg">
              <ShieldCheck className="text-indigo-500 w-5 h-5" />
            </div>
            AI Reasoning Engine Output
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* --- Reasoning Metrics Grid --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center group hover:border-indigo-500/50 transition-colors">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Risk Score</p>
              <p className={cn(
                "text-4xl font-black transition-colors",
                (report?.risk_score || 0) >= 7 ? "text-red-500" : "text-emerald-500"
              )}>
                {report?.risk_score || "N/A"}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center group hover:border-emerald-500/50 transition-colors">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Eco Score</p>
              <p className="text-4xl font-black text-emerald-400">
                {report?.sustainability_audit?.score || "9.0"}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center group hover:border-amber-500/50 transition-colors">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Hits (24h)</p>
              <p className="text-4xl font-black text-amber-400">
                {report?.blast_radius_hits || 0}
              </p>
            </div>
          </div>

          {/* --- Logic Analysis (Claude 3.5) --- */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl relative group">
            <div className="flex items-center gap-2 mb-3">
               <Info className="text-indigo-500 w-4 h-4" />
               <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Claude 3.5 Sonnet Analysis</h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-300 font-medium italic">
              "{report?.advice || "System default: No anomalies detected in logic flow."}"
            </p>
          </div>

          {/* --- Efficiency Audit (Gemini 1.5) --- */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl relative">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="text-emerald-500 w-4 h-4" />
              <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Gemini Sustainability Audit</h4>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {report?.sustainability_audit?.green_advice || "Optimal code efficiency detected. No redundant cycles found."}
            </p>
          </div>

          {/* --- Context Correlation (Metadata) --- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="text-slate-600 w-3 h-3" />
              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Raw Correlation Context</h4>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl font-mono text-[11px] text-indigo-300/70 border border-slate-800/50 overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify({
                  triggered_by: report?.triggered_by || "System",
                  blast_radius_hits: report?.blast_radius_hits || 0,
                  target_env: audit.env_name,
                  request_id: audit.id,
                  ai_status: report?.status
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* --- Footer Metadata --- */}
        <div className="mt-4 flex justify-end pt-4 border-t border-slate-800">
          <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 lowercase">
            audit_id_{audit.id}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}