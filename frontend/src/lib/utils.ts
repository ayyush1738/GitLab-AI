import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🛠️ CN (Class Name) Helper
 * Standard in modern Next.js apps. Combines clsx and tailwind-merge.
 * It allows you to conditionally join classNames and ensures that 
 * the last defined Tailwind class wins (preventing style bugs).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 🕒 Date Formatter
 * Formats your Flask backend ISO strings (from models.py) 
 * into human-readable strings for the Audit Trail.
 */
export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * 📊 Number Formatter
 * Used for the 'Blast Radius' hit counts. 
 * Converts 1200 to "1.2k" for a cleaner dashboard UI.
 */
export function formatCompactNumber(number: number) {
  const formatter = Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return formatter.format(number);
}

/**
 * 🛡️ Risk Color Mapper
 * Maps your AIAssessment risk_level to CSS classes.
 */
export function getRiskColor(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'high':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'medium':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'low':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    default:
      return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  }
}

/**
 * 🚀 API Delay (Development Only)
 * Useful for testing those "Loading" states and Skeleton screens 
 * before your AI Agent finishes reasoning.
 */
export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));