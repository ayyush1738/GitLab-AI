import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * 🏷️ Badge Variants
 * Optimized for SafeConfig AI's security-first dashboard.
 * Designed for readability on #020617 (Deep Navy) background.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
        secondary:
          "border-transparent bg-slate-800 text-slate-100 hover:bg-slate-700",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-500",
        outline: 
          "text-slate-500 border-slate-800 bg-transparent",
        success: 
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-500",
        // 🚀 GitLab-specific variant for our SSO and CI/CD narrative
        gitlab:
          "border-[#e24329]/30 bg-[#e24329]/10 text-[#e24329]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }