import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Arquivo" };

export default async function ArchivePage() {
  const session = await getSession();
  const access = evaluateAccess(session, "archive");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-white">Arquivo</h1>
      <p className="max-w-2xl text-cm-gray">
        Casos não públicos, disponíveis somente em áudio para assinantes Tier 2.
      </p>
      {!access.allowed ? (
        <PaywallCard state={access} />
      ) : (
        <ul className="space-y-3 text-sm text-cm-gray">
          <li className="rounded-sm border border-cm-gray-dark p-4">
            Ficha de caso (player protegido) — aguardando cadastro editorial no admin.
          </li>
        </ul>
      )}
    </div>
  );
}
