export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      
      <div className="w-full max-w-md px-4">
        {children}
      </div>
      
      <p className="mt-8 text-slate-500 text-xs text-center">
        Secure OAuth 2.0 via GitHub Sentinel & SafeConfig AI
      </p>
    </div>
  );
}