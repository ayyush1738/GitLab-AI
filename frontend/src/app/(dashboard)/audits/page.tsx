"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  FileJson, 
  ShieldAlert,
  Clock,
  Globe,
  Search,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import { useState, useMemo } from "react";
import { AiService } from "@/services/ai.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AuditDetailModal } from "@/components/audit/audit-detail-modal";
import { cn, formatDate } from "@/lib/utils";
import { AuditLog } from "@/types/models";

/**
 * 📜 Compliance Ledger Page
 * Purpose: Provides a high-fidelity audit trail of all AI-governed deployments.
 * Category: Governance & Security (Grand Prize Target)
 */
export default function AuditsPage() {
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 📡 Fetch logs via the centralized AI service
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => AiService.getAuditLogs(),
    refetchInterval: 60000, // Sync every minute
  });

  // 🔍 Client-side filtering: Searches across Reason, Action, and Environment
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => 
      log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.env_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.flag_key?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-indigo-500 w-8 h-8" />
            Compliance Ledger
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Immutable audit trail of all <span className="text-indigo-400">Claude 3.5 & Gemini</span> orchestrated changes.
          </p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder="Search by flag, action, or reason..." 
            className="pl-10 bg-slate-900/50 border-slate-800 text-white focus:border-indigo-500/50 rounded-xl transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* --- Main Audit Table --- */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/20">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Node</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Verdict</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Justification</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Audit Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-500 text-xs font-mono tracking-widest uppercase">Deciphering Secure Ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center text-slate-500 text-sm font-mono italic">
                    No matching audit records found for "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-all group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {log.flag_key || "System"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                          <Clock size={10} className="text-indigo-500/70" />
                          {formatDate(log.timestamp)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-slate-950/50 border-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-md">
                        <Globe size={10} className="mr-1.5 opacity-50" />
                        {log.env_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Activity size={10} className={cn(
                              log.ai_report?.risk_score && log.ai_report.risk_score > 7 ? "text-rose-500" : "text-emerald-500"
                            )} />
                            <span className="text-[10px] text-white font-mono font-bold">
                              {log.ai_report?.risk_score || 0}/10
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                            Risk Index
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400 max-w-[240px] truncate font-medium group-hover:text-slate-200 transition-colors">
                        {log.reason || "Automatic system adjustment."}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedAudit(log)}
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 gap-2 h-9 px-4 rounded-xl transition-all"
                      >
                        <FileJson size={14} />
                        View Audit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Report Modal --- */}
      {selectedAudit && (
        <AuditDetailModal 
          audit={selectedAudit} 
          isOpen={!!selectedAudit} 
          onClose={() => setSelectedAudit(null)} 
        />
      )}
    </div>
  );
}

/**
 * 🎨 Action Badge Component
 * Context-aware styling for different deployment verdicts.
 */
function ActionBadge({ action }: { action: string }) {
  const isBlocked = action.includes("BLOCK");
  const isOverride = action.includes("OVERRIDE");
  
  let styles = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  let Icon = Zap;

  if (isBlocked) {
    styles = "bg-rose-500/10 text-rose-500 border-rose-500/20";
    Icon = ShieldAlert;
  } else if (isOverride) {
    styles = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    Icon = ShieldCheck;
  }

  return (
    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-tighter gap-1.5 px-2.5 py-1", styles)}>
      <Icon size={10} />
      {action.replace("_", " ")}
    </Badge>
  );
}