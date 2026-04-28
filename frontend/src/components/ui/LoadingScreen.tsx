export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0a14] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-altair-600/20 border border-altair-500/30 flex items-center justify-center">
          <span className="text-2xl font-display font-bold text-altair-400">A</span>
        </div>
        <div className="absolute inset-0 rounded-2xl border border-altair-500/40 animate-ping" />
      </div>
      <p className="text-slate-500 text-sm font-medium">Loading Altair 2.0...</p>
    </div>
  );
}
