"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // 🚀 Import the Auth Hook

/**
 * Custom GitLab Icon
 */
const GitLabIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.417-.724-.417-.859 0L16.425 9.451H7.575L4.91 1.263c-.135-.417-.724-.417-.859 0L1.387 9.452.045 13.587c-.114.352.016.74.323.963l11.632 8.455 11.633-8.455c.307-.223.437-.611.322-.963z" />
  </svg>
);

export default function LoginPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { login } = useAuth(); // 🔗 Connect to our Global Auth logic

  const handleLogin = () => {
    setIsRedirecting(true);
    // 🚀 THE BRIDGE: Use the centralized login trigger
    // This will redirect the user to http://127.0.0.1:5000/login/gitlab
    login();
  };

  return (
    <div className="flex min-h-[400px] w-full max-w-md flex-col justify-center">
      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-orange-600 p-3 rounded-xl mb-4 shadow-lg shadow-orange-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Governance Portal</h1>
          <p className="text-slate-400 text-sm mt-2">
            Authorized personnel only. Access requires GitLab SSO.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleLogin}
            disabled={isRedirecting}
            size="lg" 
            className="w-full bg-[#fca326] hover:bg-[#e28905] text-white gap-3 font-semibold h-12 transition-all active:scale-[0.98] border-none"
          >
            {isRedirecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <GitLabIcon className="w-5 h-5" />
            )}
            {isRedirecting ? "Connecting..." : "Continue with GitLab"}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#020617] px-2 text-slate-500 font-medium">System Status</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <StatusIndicator 
              label="AI Agent" 
              status="Claude-3.5" 
              color="bg-emerald-500" 
            />
            <StatusIndicator 
              label="Blast Radius" 
              status="Redis Active" 
              color="bg-indigo-500" 
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-xs text-slate-500 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group"
          >
            Back to homepage 
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
      
      <p className="mt-4 text-center text-[10px] text-slate-600 uppercase tracking-widest">
        GitGuardian Governance Engine v1.0
      </p>
    </div>
  );
}

function StatusIndicator({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="p-2 rounded-lg bg-slate-800/30 border border-slate-800/50">
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{label}</p>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${color}`} />
        <span className="text-[11px] text-slate-300 font-medium">{status}</span>
      </div>
    </div>
  );
}