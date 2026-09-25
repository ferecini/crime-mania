import Link from "next/link";
import type { PaywallState } from "@/lib/paywall";
import { ButtonLink } from "@/components/ui/Button";

export function PaywallCard({ state }: { state: PaywallState }) {
  if (state.allowed) return null;
  const tierName = state.requiredTier === "tier1" ? "Tier 1" : "Tier 2";

  return (
    <div className="cm-panel relative overflow-hidden p-6 md:p-8" role="status">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cm-red/15 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-cm-gray">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs tracking-[0.25em] text-cm-red">Conteúdo premium</p>
          <p className="mt-2 text-base leading-relaxed text-white/90">{state.message}</p>
          <p className="mt-2 text-sm text-cm-gray">
            Plano mínimo: <span className="text-white">{tierName}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href={state.ctaHref}>{state.ctaLabel}</ButtonLink>
            <Link
              href="/membro/planos"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-cm-gray hover:text-white"
            >
              Comparar benefícios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
