import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Crime Mania Juris" };

export default async function JurisPage() {
  const session = await getSession();
  const access = evaluateAccess(session, "jurisCatalog");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-white">Crime Mania Juris</h1>
      <p className="max-w-2xl text-cm-gray">
        Mesmo conteúdo jurídico da seção 6 dos dossiês, em catálogo dedicado — Tier 2.
      </p>
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : (
        <p className="text-sm text-cm-gray">Catálogo Juris em preparação.</p>
      )}
    </div>
  );
}
