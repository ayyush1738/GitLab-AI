import Link from "next/link";
import { ShieldCheck, Zap, Lock, Globe, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-slate-50 selection:bg-indigo-500/30">
      {/* --- Navigation --- */}
      <header className="px-6 h-20 flex items-center border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SafeConfig <span className="text-indigo-500 text-sm font-mono italic">AI</span></span>
        </div>
        <nav className="ml-auto flex gap-6 items-center">
          <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
          <Link href="/auth/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</Link>
          <Button variant="outline" className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-50 gap-2">
            <Github className="w-4 h-4" /> Documentation
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Animated Background Blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-emerald-600 rounded-full blur-[100px]" />
          </div>

          <div className="container px-4 mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Now Integrated with GitLab Duo Agent
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              Stop Leaks Before <br className="hidden md:block" /> They Hit Production
            </h1>
            
            <p className="max-w-[700px] mx-auto text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
              The first AI-orchestrated configuration guardrail. Correlate <span className="text-white">Claude 3.5</span> reasoning with <span className="text-white">Real-time Blast Radius</span> data to protect your infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 text-md rounded-full gap-2">
                  Launch Console <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50 h-12 px-8 rounded-full">
                View Sample Audit
              </Button>
            </div>
          </div>
        </section>

        {/* --- Feature Grid --- */}
        <section id="features" className="container px-4 py-24 mx-auto border-t border-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-400" />}
              title="Blast Radius Tracking"
              description="Our Redis-backed traffic service monitors hits in real-time, calculating exactly how many users are impacted by a config change."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
              title="AI Guardrails"
              description="High-risk changes are automatically blocked by the LangChain agent unless overridden by a verified Manager."
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6 text-emerald-400" />}
              title="Green Sustainability"
              description="Powered by Gemini 1.5 Flash to audit code efficiency and reduce carbon footprint in your scaling infrastructure."
            />
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="py-12 px-6 border-t border-slate-800/50 bg-[#010409]">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            © 2026 SafeConfig AI. Built for the Google Cloud Prize.
          </p>
          <div className="flex gap-8 text-slate-400 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="https://github.com/your-repo" className="hover:text-white transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all group">
      <div className="mb-4 inline-block">{icon}</div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}