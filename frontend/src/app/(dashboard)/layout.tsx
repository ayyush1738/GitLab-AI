"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Flag, 
  ShieldCheck, 
  Activity, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // 🚀 Connect to your actual Auth state

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { user, logout } = useAuth(); // Assuming your context provides these
  const router = useRouter();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Feature Flags", href: "/flags", icon: Flag },
    { name: "Compliance Ledger", href: "/audits", icon: ShieldCheck },
    { name: "Blast Radius", href: "/analytics", icon: Activity },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden selection:bg-indigo-500/30">
      
      {/* --- Sidebar --- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/40 border-r border-slate-800/60 backdrop-blur-2xl transition-all duration-300 lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60">
            <div className={cn("flex items-center gap-3", !isSidebarOpen && "lg:hidden")}>
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight text-sm uppercase italic">SafeConfig AI</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex text-slate-500 hover:text-white hover:bg-slate-800/50"
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                    isActive 
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  )}>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                    <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-400" : "group-hover:text-slate-200")} />
                    <span className={cn("font-semibold text-xs uppercase tracking-widest", !isSidebarOpen && "lg:hidden")}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Section (Linked to AuthContext) */}
          <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
            <div className={cn("flex items-center gap-3 p-3 rounded-2xl bg-slate-800/30 border border-slate-800/50", !isSidebarOpen && "lg:justify-center")}>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <User size={18} className="text-indigo-400" />
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
                    {user?.role || "Personnel"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">
                    {user?.email || "syncing..."}
                  </p>
                </div>
              )}
            </div>
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className={cn("w-full justify-start mt-4 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 gap-3 rounded-xl h-11", !isSidebarOpen && "lg:px-0 lg:justify-center")}
            >
              <LogOut size={18} />
              <span className={cn("text-xs font-bold uppercase tracking-widest", !isSidebarOpen && "lg:hidden")}>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />

        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-8 bg-[#020617]/40 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              System // {pathname.split("/")[1] || "Core"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Duo Agents Online</span>
            </div>
            <Button size="icon" variant="ghost" className="text-slate-500 hover:text-white rounded-xl">
              <Settings size={20} />
            </Button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}