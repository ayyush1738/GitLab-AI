import { cn } from "@/src/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon, description, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-800 rounded-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
            trendUp === true ? "text-emerald-400 bg-emerald-400/10" : 
            trendUp === false ? "text-red-400 bg-red-400/10" : "text-slate-400 bg-slate-800"
          )}>
            {trendUp === true && <ArrowUpRight size={10} />}
            {trendUp === false && <ArrowDownRight size={10} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">{title}</p>
        <p className="text-[10px] text-slate-600 mt-3 italic">{description}</p>
      </div>
    </div>
  );
}