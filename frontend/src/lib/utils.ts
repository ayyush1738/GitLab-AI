import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🎨 CN (Class Name) Helper
 * Standard for modern Next.js + Tailwind stacks.
 * Merges class names and handles Tailwind conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 🕒 Date Formatter (Absolute)
 * Formats ISO strings into: "Oct 12, 2026, 03:45 PM"
 */
export function formatDate(date: string | Date | undefined) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * ⏱️ Relative Time Formatter
 * Formats dates into: "Just now", "5m ago", "2h ago"
 * Perfect for the 'Compliance Ledger' to show recent AI decisions.
 */
export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * 📊 Compact Number Formatter
 * Converts 14200 into "14.2k".
 * Essential for the 'Blast Radius' traffic metrics.
 */
export function formatCompactNumber(number: number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

/**
 * 🛡️ Security Style Mapper
 * Maps AIAssessment risk_level to a palette of Tailwind classes.
 * Optimized for the GitGuardian 'Command Center' aesthetic.
 */
export function getRiskStyles(level: 'low' | 'medium' | 'high' | string) {
  const normalized = level.toLowerCase();
  
  const styles = {
    high: {
      text: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      glow: "shadow-[0_0_15px_rgba(244,63,94,0.2)]",
      label: "Critical Risk"
    },
    medium: {
      text: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
      label: "Warning"
    },
    low: {
      text: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      label: "Secure"
    }
  };

  return styles[normalized as keyof typeof styles] || {
    text: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-800",
    glow: "",
    label: "Unknown"
  };
}

/**
 * 🚀 Development Delay
 * Simulates network latency for testing 'Duo Agent' reasoning animations.
 */
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));