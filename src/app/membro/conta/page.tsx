import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) return null;

  const tierLabel =
    session.tier === "tier2"
      ? "Tier 2 ativo"
      : session.tier === "tier1"
        ? "Tier 1 ativo"
        : "Sem assinatura";

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-3xl text-white">Minha conta</h1>
      <dl className="divide-y divide-cm-gray-dark rounded-sm border border-cm-gray-dark text-sm">
        <div className="grid grid-cols-3 gap-2 p-4">
          <dt className="text-cm-gray">Nome</dt>
          <dd className="col-span-2 text-white">{session.displayName}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          <dt className="text-cm-gray">E-mail</dt>
          <dd className="col-span-2 text-white">{session.email}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          <dt className="text-cm-gray">Plano</dt>
          <dd className="col-span-2 text-white">{tierLabel}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          <dt className="text-cm-gray">Provedor</dt>
          <dd className="col-span-2 capitalize text-white">{session.provider}</dd>
        </div>
      </dl>
      <p className="text-xs text-cm-gray">
        Histórico de pagamentos e portal de cobrança ficam disponíveis após a ativação do gateway
        de pagamentos.
      </p>
    </div>
  );
}
