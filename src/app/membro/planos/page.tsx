import { PlansTable } from "@/components/member/PlansTable";
import { SubscribeButtons } from "@/components/member/SubscribeButtons";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Planos" };

export default async function PlansPage() {
  const session = await getSession();
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl text-white">Planos e benefícios</h1>
        <p className="mt-3 max-w-2xl text-cm-gray">
          Escolha Tier 1 mensal, Tier 2 mensal ou Tier 2 anual. Os dois Tier 2 compartilham os
          mesmos recursos — apenas o ciclo de cobrança muda.
        </p>
        {session?.tier !== "none" && (
          <p className="mt-2 text-sm text-white">
            Plano atual:{" "}
            <strong>
              {session?.tier === "tier2" ? "Tier 2" : session?.tier === "tier1" ? "Tier 1" : "—"}
            </strong>
          </p>
        )}
      </div>
      <SubscribeButtons />
      <PlansTable />
    </div>
  );
}
