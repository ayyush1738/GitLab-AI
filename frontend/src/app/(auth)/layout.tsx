import React from "react";

/**
 * AuthLayout: The high-security wrapper for Login and Registration.
 * Features an ambient glow and centralized branding.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden selection:bg-orange-500/30">
      
      {/* 🌌 Dynamic Ambient Glow: Indigo for Security, Orange for GitLab */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-orange-600/5 rounded-full blur-[100px] -z-10" />
      
      {/* 📦 Auth Container */}
      <div className="w-full max-w-md px-4 z-10 animate-in fade-in zoom-in-95 duration-500">
        {children}
      </div>
      
      {/* 🏛️ Compliance Footer */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium text-center">
          Secure SSO via GitLab Identity & SafeConfig AI
        </p>
        <div className="flex items-center gap-3 opacity-30">
          <div className="h-px w-8 bg-slate-700" />
          <span className="text-[9px] text-slate-400 font-mono">AES-256 ENCRYPTED SESSION</span>
          <div className="h-px w-8 bg-slate-700" />
        </div>
      </div>
    </div>
  );
}