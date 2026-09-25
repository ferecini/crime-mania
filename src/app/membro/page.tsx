import Link from "next/link";
import { LockedTile } from "@/components/member/LockedTile";
import { getSession } from "@/lib/auth/session";
import { tierHasFeature } from "@/lib/plans";

export const metadata = { title: "Área de membros" };

export default async function MemberHomePage() {
  const session = await getSession();
  const tier = session?.tier ?? "none";

  const tiles = [
    {
      title: "Dossiês",
      description: "Resumo, galeria, mapa, linha do tempo, teorias e Juris por caso.",
      href: "/membro/dossies",
      locked: !tierHasFeature(tier, "dossierSummary"),
    },
    {
      title: "Arquivo",
      description: "Casos não públicos, somente áudio — Tier 2.",
      href: "/membro/arquivo",
      locked: !tierHasFeature(tier, "archive"),
    },
    {
      title: "Conteúdo exclusivo",
      description: "Episódios extras e newsletter em áudio/vídeo.",
      href: "/membro/exclusivo",
      locked: !tierHasFeature(tier, "exclusive"),
    },
    {
      title: "Crime Mania Juris",
      description: "Análises jurídicas em áudio e vídeo.",
      href: "/membro/juris",
      locked: !tierHasFeature(tier, "jurisCatalog"),
    },
    {
      title: "Comunidade",
      description: "Fórum geral e sugestão de casos.",
      href: "/membro/comunidade",
      locked: !tierHasFeature(tier, "forum"),
    },
    {
      title: "Shop",
      description: "15% off e prioridade para assinantes.",
      href: "/membro/shop",
      locked: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-white">Sua central Crime Mania</h1>
        <p className="mt-3 max-w-2xl text-cm-gray">
          {tier === "none"
            ? "Você está logado, mas ainda não tem assinatura. Explore os cartões com cadeado e escolha um plano."
            : "Conteúdo liberado conforme seu plano atual."}
        </p>
        {tier === "none" && (
          <Link
            href="/membro/planos"
            className="mt-4 inline-block text-sm font-semibold text-cm-red hover:underline"
          >
            Conheça os planos →
          </Link>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) =>
          tile.locked ? (
            <LockedTile
              key={tile.href}
              title={tile.title}
              description={tile.description}
              href={tile.href}
            />
          ) : (
            <Link
              key={tile.href}
              href={tile.href}
              className="rounded-sm border border-cm-gray-dark bg-cm-surface p-5 hover:border-cm-red/50"
            >
              <h2 className="font-semibold text-white">{tile.title}</h2>
              <p className="mt-2 text-sm text-cm-gray">{tile.description}</p>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
