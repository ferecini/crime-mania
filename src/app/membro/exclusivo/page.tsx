import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Conteúdo exclusivo" };

export default async function ExclusivePage() {
  const session = await getSession();
  const access = evaluateAccess(session, "exclusive");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-white">Conteúdo exclusivo</h1>
      <p className="max-w-2xl text-cm-gray">
        Episódios extras ou newsletter em áudio e vídeo — Tier 2. Espaço reservado para vínculo
        futuro com dossiês, se a equipe decidir.
      </p>
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : (
        <p className="text-sm text-cm-gray">Nenhum item publicado ainda.</p>
      )}
    </div>
  );
}
