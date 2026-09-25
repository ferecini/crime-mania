import { PlansComparisonMobile } from "@/components/member/PlansComparisonMobile";
import { PlansTable } from "@/components/member/PlansTable";
import { SubscribeButtons } from "@/components/member/SubscribeButtons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Planos" };

export default async function PlansPage() {
  const session = await getSession();
  return (
    <div className="space-y-10">
      <SectionHeader
        kicker="Assinatura"
        title="Planos e benefícios"
        description="Escolha Tier 1 mensal, Tier 2 mensal ou Tier 2 anual. O Tier 2 mensal e anual compartilham os mesmos recursos premium."
      />
      {session?.tier !== "none" && (
        <p className="cm-panel px-4 py-3 text-sm text-white">
          Plano atual:{" "}
          <strong>
            {session?.tier === "tier2" ? "Tier 2" : session?.tier === "tier1" ? "Tier 1" : "—"}
          </strong>
        </p>
      )}
      <SubscribeButtons />
      <PlansComparisonMobile />
      <PlansTable />
    </div>
  );
}
