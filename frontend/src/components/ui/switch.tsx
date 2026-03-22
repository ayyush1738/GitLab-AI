"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

/**
 * 🎚️ Custom Security Switch
 * Purpose: The primary trigger for 'SafeConfig' AI-guarded toggles.
 * Features: High-contrast emerald/indigo states and focus-ring offsets for accessibility.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-emerald-500 data-[state=checked]:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
      "data-[state=unchecked]:bg-slate-800",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xl ring-0 transition-transform duration-300",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        "flex items-center justify-center"
      )}
    >
      {/* Subtle indicator inside the thumb for extra detail */}
      <div className="h-1 w-1 rounded-full bg-slate-200 opacity-50" />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }