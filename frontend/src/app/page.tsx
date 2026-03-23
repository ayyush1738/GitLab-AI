import Link from "next/link";
import { ShieldCheck, Zap, Globe, ArrowRight, Github, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-slate-50 selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* --- Navigation --- */}
      <header className="px-8 h-20 flex items-center border-b border-slate-800/40 backdrop-blur-xl sticky top-0 z-50 bg-[#020617]/70">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:rotate-12 transition-all shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">
            SafeConfig <span className="text-indigo-500 not-italic font-mono text-sm ml-1">AI</span>
          </span>
        </div>
        <nav className="ml-auto hidden md:flex gap-8 items-center">
          <Link href="#features" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Capabilities</Link>
          <Link href="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Console Access</Link>
          <Button variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-100 gap-2 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl">
            <Github className="w-3.5 h-3.5" /> Source Code
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="relative pt-24 pb-40">
          {/* 🌌 Cybernetic Background Blurs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
            <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px]" />
          </div>

          <div className="container px-6 mx-auto text-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              SafeConfig Duo Agent v1.0 Live
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 leading-[0.9]">
              Secure Deployment <br className="hidden md:block" /> Guardrails
            </h1>
            
            <p className="max-w-[750px] mx-auto text-slate-400 text-lg md:text-xl mb-12 leading-relaxed font-medium">
              The industry's first AI-orchestrated configuration firewall. We correlate <span className="text-white">Claude 3.5</span> reasoning with <span className="text-white">Real-time Blast Radius</span> telemetry to shield your production clusters.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link href="/login">
                <Button size="lg" className="bg-white hover:bg-slate-200 text-slate-950 px-10 h-14 text-sm font-black uppercase tracking-widest rounded-2xl gap-3 shadow-xl shadow-white/5 transition-all active:scale-95">
                  Launch Console <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 h-14 px-10 rounded-2xl text-sm font-black uppercase tracking-widest gap-2">
                <Cpu className="w-4 h-4" /> View Technical Spec
              </Button>
            </div>
          </div>
        </section>

        {/* --- Feature Grid --- */}
        <section id="features" className="container px-6 py-32 mx-auto border-t border-slate-800/40 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-400" />}
              title="Blast Radius Intel"
              description="Redis-backed traffic service monitors hits in real-time, calculating user impact density before any toggle is executed."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
              title="Governance-as-Code"
              description="Claude 3.5 Sonnet audits every MR and toggle. High-risk changes are locked behind Manager-only biometric overrides."
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6 text-emerald-400" />}
              title="Eco-Efficiency"
              description="Powered by Gemini 1.5 Flash to audit code sustainability, reducing redundant compute cycles and cloud carbon footprint."
            />
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="py-16 px-8 border-t border-slate-800/40 bg-[#010409]/50 backdrop-blur-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-white font-black text-sm uppercase tracking-widest italic">SafeConfig AI</p>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
              Built for the Google Cloud Prize 2026 // Jaipur Node
            </p>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Link href="#" className="hover:text-indigo-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-indigo-400 transition-colors">Protocols</Link>
            <Link href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Github className="w-3 h-3" /> GitLab
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-10 rounded-[2.5rem] border border-slate-800/60 bg-slate-900/30 hover:border-indigo-500/30 hover:bg-slate-900/50 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="mb-6 inline-block bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner">{icon}</div>
      <h3 className="text-lg font-black uppercase tracking-tight mb-4 group-hover:text-indigo-400 transition-colors">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm font-medium">
        {description}
      </p>
    </div>
  );
}