import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EpisodePlayer } from "@/components/media/EpisodePlayer";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { getEpisodeBySlug } from "@/data/episodes";
import { formatDateBR } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) return { title: "Episódio" };
  const title = `${episode.category}: ${episode.title}`;
  return {
    title,
    description: episode.summary,
    openGraph: {
      title,
      description: episode.summary,
      images: [{ url: episode.coverImage, alt: episode.title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: episode.summary,
      images: [episode.coverImage],
    },
  };
}

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) notFound();

  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container max-w-4xl">
        <Link href="/episodios" className="text-sm text-cm-gray transition hover:text-white">
          ← Episódios
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
          <div className="cm-portrait-frame relative aspect-square w-full max-w-[280px]">
            <Image
              src={episode.coverImage}
              alt={`Capa do episódio ${episode.title}`}
              fill
              className="object-cover"
              sizes="280px"
              priority
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{episode.category}</Tag>
              <span className="font-display text-xs text-cm-gray">
                Ep. {String(episode.number).padStart(3, "0")}
              </span>
            </div>
            <h1 className="font-display mt-4 text-3xl leading-tight text-white md:text-4xl lg:text-5xl">
              {episode.title}
            </h1>
            <p className="mt-3 text-sm text-cm-gray">
              {episode.duration} · {formatDateBR(episode.publishedAt)}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-cm-gray md:text-lg">
              {episode.summary}
            </p>
          </div>
        </div>

        <div id="player" className="mt-12 scroll-mt-28">
          <h2 className="font-display mb-4 text-sm tracking-[0.3em] text-cm-gray">Ouvir</h2>
          <EpisodePlayer episode={episode} />
        </div>

        <div className="cm-panel mt-12 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.25em] text-cm-red">Membros</p>
            <p className="mt-2 text-sm text-cm-gray">
              Crie sua conta gratuita para salvar favoritos (em breve) e assine para desbloquear
              dossiês, Arquivo e Juris.
            </p>
          </div>
          <ButtonLink href="/membro/planos" className="shrink-0">
            Conheça os planos
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
