export function ProductVisual({ type }: { type: "mug" | "shirt" }) {
  if (type === "mug") {
    return (
      <div
        className="relative flex h-full min-h-[220px] items-end justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a] p-8"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(144,2,0,0.35),transparent_55%)]" />
        <div className="relative h-40 w-32 rounded-b-xl border border-white/10 bg-gradient-to-b from-[#2a2a2a] to-[#141414] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="absolute -top-3 left-1/2 h-4 w-16 -translate-x-1/2 rounded-t-md border border-white/10 bg-[#1f1f1f]" />
          <div className="absolute inset-x-0 top-8 flex justify-center">
            <span className="font-display text-[9px] tracking-[0.3em] text-white/80">
              CRIME
            </span>
          </div>
          <div className="absolute inset-x-0 top-14 flex justify-center">
            <span className="font-display text-[9px] tracking-[0.3em] text-cm-gray">
              MANIA
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full min-h-[220px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a] p-8"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(144,2,0,0.28),transparent_50%)]" />
      <div className="relative h-44 w-40 rounded-lg border border-white/10 bg-[#151515] shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
        <div className="absolute left-3 top-10 h-10 w-10 rounded-full border border-white/10 bg-[#0d0d0d]" />
        <div className="absolute right-3 top-10 h-10 w-10 rounded-full border border-white/10 bg-[#0d0d0d]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-4">
          <span className="font-display text-[10px] tracking-[0.35em] text-white">CRIME</span>
          <span className="font-display text-[10px] tracking-[0.35em] text-cm-gray">MANIA</span>
        </div>
      </div>
    </div>
  );
}
