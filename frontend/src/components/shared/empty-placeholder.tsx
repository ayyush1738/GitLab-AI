import { LucideIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyPlaceholder({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}: EmptyPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
      <div className="p-4 bg-slate-800/50 rounded-full mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} variant="outline" className="border-slate-700 hover:bg-slate-800 gap-2">
          <Info size={14} />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}