type Props = {
  /** SOA habilitado e configurado no servidor. */
  enabled: boolean;
  tier: "none" | "tier1" | "tier2";
  /** Assinatura aguardando pagamento. */
  pending: boolean;
  isTestUser?: boolean;
  /** Resultado do último fluxo OAuth (?spotify=...). */
  status?: string;
};

const STATUS_MESSAGES: Record<string, string> = {
  error: "Não foi possível conectar o Spotify. Tente novamente em instantes.",
  disabled: "A conexão com o Spotify ainda não está disponível.",
  no_plan: "Assine um plano ativo para conectar o Spotify.",
  qa: "Contas de QA não usam a conexão com o Spotify.",
};

export function SpotifyLinkPanel({ enabled, tier, pending, isTestUser, status }: Props) {
  if (!enabled) return null;

  const statusMessage = status ? STATUS_MESSAGES[status] : undefined;
  const canLink = !isTestUser && !pending && (tier === "tier1" || tier === "tier2");

  let hint: string;
  if (isTestUser) hint = STATUS_MESSAGES.qa;
  else if (pending) hint = "Disponível após a confirmação do pagamento.";
  else if (!canLink) hint = "Disponível para assinantes Tier 1 e Tier 2.";
  else hint = "Ouça os episódios exclusivos direto no app do Spotify.";

  return (
    <section className="space-y-3 rounded-sm border border-cm-gray-dark p-4 text-sm">
      <h2 className="font-display text-xl text-white">Spotify</h2>
      <p className="text-cm-gray">{hint}</p>
      {statusMessage ? (
        <p role="status" className="text-white">
          {statusMessage}
        </p>
      ) : null}
      {canLink ? (
        /* <a> em vez de next/link: evita prefetch do route handler que redireciona ao Spotify. */
        <a
          href="/membro/spotify/conectar"
          className="inline-flex min-h-12 items-center justify-center rounded-[4px] border border-transparent bg-cm-red px-6 py-2.5 text-sm font-semibold tracking-wide text-white transition-colors duration-200 hover:bg-cm-red-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white"
        >
          Conectar Spotify
        </a>
      ) : null}
    </section>
  );
}
