"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  ShieldCheck, 
  Search, 
  FileJson, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert,
  Clock,
  Globe
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { AuditDetailModal } from "@/components/audit/audit-detail-modal";

// ✅ Updated Interface to match Flask AuditLog.to_dict()
interface AuditLog {
  id: number;
  action: string;
  reason: string;
  env_name: string; // Added this to fix the TS error
  ai_report: any;
  timestamp: string;
}

export default function AuditsPage() {
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/flags/logs`, { 
        withCredentials: true 
      });
      return res.data.data as AuditLog[];
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Compliance Ledger</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Immutable audit trail of all AI-orchestrated configuration changes.
        </p>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Env</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reasoning</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">AI Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic animate-pulse">
                    Retrieving secure audit history...
                  </td>
                </tr>
              ) : (
                logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} className="text-indigo-500" />
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
                        <Globe size={10} />
                        {log.env_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-300 max-w-xs truncate font-medium">
                        {log.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedAudit(log)}
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-2 h-8 px-3 rounded-lg"
                      >
                        <FileJson size={14} />
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for AI Data breakdown */}
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

function ActionBadge({ action }: { action: string }) {
  const isBlocked = action.includes("BLOCK");
  const isOverride = action.includes("OVERRIDE");

  return (
    <Badge variant={isBlocked ? "destructive" : isOverride ? "warning" : "success"} className="text-[9px] font-black">
      {isBlocked && <ShieldAlert size={10} className="mr-1" />}
      {!isBlocked && !isOverride && <CheckCircle2 size={10} className="mr-1" />}
      {action}
    </Badge>
  );
}