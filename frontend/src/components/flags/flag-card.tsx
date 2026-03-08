"use client";

import { FeatureFlag } from "@/types/models";
import { useFlags } from "@/hooks/use-flags";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // Assuming you have a standard Switch primitive
import { Globe, MoreVertical, Terminal, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlagCardProps {
  flag: FeatureFlag;
  onSelect: (flag: FeatureFlag) => void;
}

export function FlagCard({ flag, onSelect }: FlagCardProps) {
  const { toggleFlag, isToggling } = useFlags();

  const handleToggle = (envId: number, currentEnabled: boolean) => {
    const reason = window.prompt("Reason for manual toggle override:");
    if (!reason) return;

    toggleFlag({ 
      flagId: flag.id, 
      envId, 
      reason 
    });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-600/20 transition-colors">
            <Terminal className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{flag.name}</h3>
            <code className="text-[10px] text-slate-500 font-mono">{flag.key}</code>
          </div>
        </div>
        <button className="text-slate-600 hover:text-white transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-6 line-clamp-2 min-h-[32px]">
        {flag.description || "No description provided for this AI-orchestrated flag."}
      </p>

      <div className="space-y-3">
        {flag.statuses.map((status, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/50">
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                {status.environment_name}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={status.is_enabled ? "success" : "secondary"} className="text-[8px] py-0">
                {status.is_enabled ? "Active" : "Off"}
              </Badge>
              <Switch 
                checked={status.is_enabled}
                onCheckedChange={() => handleToggle(idx + 1, status.is_enabled)}
                disabled={isToggling}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}