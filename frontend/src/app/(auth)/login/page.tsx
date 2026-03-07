"use client";

import { Button } from "@/src/components/ui/button";
import { ShieldCheck, Github, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const handleLogin = () => {
    // Redirecting directly to your Flask Backend OAuth trigger
    // Match this with your GITHUB_ID/SECRET setup in __init__.py
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="bg-indigo-600 p-3 rounded-xl mb-4 shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
        <p className="text-slate-400 text-sm mt-2">
          Authorized personnel only. Access requires GitHub SSO.
        </p>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={handleLogin}
          size="lg" 
          className="w-full bg-white hover:bg-slate-100 text-slate-950 gap-3 font-semibold h-12"
        >
          <Github className="w-5 h-5" />
          Continue with GitHub
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#020617] px-2 text-slate-500">System Status</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <StatusIndicator label="AI Agent" status="Online" color="bg-emerald-500" />
          <StatusIndicator label="Blast Radius" status="Ready" color="bg-indigo-500" />
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors inline-flex items-center gap-1">
          Back to homepage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function StatusIndicator({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="p-2 rounded-lg bg-slate-800/30 border border-slate-800/50">
      <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <span className="text-xs text-slate-300 font-medium">{status}</span>
      </div>
    </div>
  );
}