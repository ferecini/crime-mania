import Link from "next/link";
import type { PaywallState } from "@/lib/paywall";
import { ButtonLink } from "@/components/ui/Button";

export function PaywallCard({ state }: { state: PaywallState }) {
  if (state.allowed) return null;
  return (
    <div
      className="rounded-sm border border-cm-gray-dark bg-cm-surface-elevated p-6 text-center"
      role="status"
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-cm-gray-dark text-cm-gray">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <p className="text-sm leading-relaxed text-cm-gray">{state.message}</p>
      <ButtonLink href={state.ctaHref} className="mt-4">
        {state.ctaLabel}
      </ButtonLink>
      <p className="mt-3 text-xs text-cm-gray">
        Plano mínimo:{" "}
        <span className="text-white">{state.requiredTier === "tier1" ? "Tier 1" : "Tier 2"}</span>
      </p>
      <Link href="/membro/planos" className="mt-2 inline-block text-xs text-cm-red hover:underline">
        Comparar benefícios
      </Link>
    </div>
  );
}
