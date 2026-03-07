"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Flag, 
  ShieldCheck, 
  Activity, 
  Settings, 
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * 🏰 Dashboard Layout Shell
 * Provides the Sidebar and Topbar navigation.
 * Integrated with your Backend Role system (Manager vs Developer).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Navigation Items - Matching your Flask Blueprints
  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Feature Flags", href: "/flags", icon: Flag },
    { name: "AI Audit Trail", href: "/audits", icon: ShieldCheck },
    { name: "Blast Radius", href: "/analytics", icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      {/* --- Sidebar --- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/50 border-r border-slate-800 backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className={cn("flex items-center gap-3", !isSidebarOpen && "lg:hidden")}>
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">SafeConfig</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex text-slate-500 hover:text-white"
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                    isActive 
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}>
                    <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "group-hover:text-slate-200")} />
                    <span className={cn("font-medium", !isSidebarOpen && "lg:hidden")}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Section (Mocking Role data from your /auth/me) */}
          <div className="p-4 border-t border-slate-800">
            <div className={cn("flex items-center gap-3 p-2 rounded-lg bg-slate-800/30", !isSidebarOpen && "lg:justify-center")}>
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <User size={16} className="text-indigo-400" />
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate uppercase tracking-widest">Manager</p>
                  <p className="text-[10px] text-slate-500 truncate">judge@safeconfig.ai</p>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              className={cn("w-full justify-start mt-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 gap-3", !isSidebarOpen && "lg:px-0 lg:justify-center")}
            >
              <LogOut size={18} />
              <span className={cn(!isSidebarOpen && "lg:hidden")}>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#020617]/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              {pathname.replace("/", "") || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase">System Active</span>
            </div>
            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white">
              <Settings size={20} />
            </Button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}