import { PlansComparisonMobile } from "@/components/member/PlansComparisonMobile";
import { PlansTable } from "@/components/member/PlansTable";
import { SubscribeButtons } from "@/components/member/SubscribeButtons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { SessionUser } from "@/lib/auth/session";

type Props = {
  session?: SessionUser | null;
};

export function PlansPageContent({ session }: Props) {
  return (
    <div className="space-y-10">
      <SectionHeader
        kicker="Assinatura"
        title="Planos e benefícios"
        description="Tier 1 — Acesso básico (mensal), Tier 2 — Acesso premium (mensal) e Tier 2 — Acesso total (anual), com os mesmos direitos premium no Tier 2 mensal e anual."
      />
      {session && session.tier !== "none" && (
        <p className="cm-panel px-4 py-3 text-sm text-white">
          Plano atual:{" "}
          <strong>
            {session.tier === "tier2" ? "Tier 2" : session.tier === "tier1" ? "Tier 1" : "—"}
          </strong>
        </p>
      )}
      <SubscribeButtons />
      <PlansComparisonMobile />
      <PlansTable />
    </div>
  );
}
