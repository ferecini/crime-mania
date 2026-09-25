import type { ReactNode } from "react";
import type { PublicEpisode } from "@/data/episodes";
import { formatEpisodeNumber } from "@/data/episodes";
import { formatDateBR } from "@/lib/format";
import {
  getEpisodeCoverVariation,
  resolveEpisodeBackgroundSrc,
} from "@/lib/visual/category-artwork";
import { EditorialImage } from "@/components/visual/EditorialImage";

interface EpisodeCoverProps {
  episode: Pick<
    PublicEpisode,
    "title" | "category" | "number" | "publishedAt" | "coverImage"
  >;
  index?: number;
  /** compact = listagem; feature = destaque; hero = página do episódio */
  variant?: "compact" | "feature" | "hero";
  children?: ReactNode;
  className?: string;
  /** Metadados sobre a imagem (listagens); desligar na página do episódio se o título vier abaixo. */
  showMetaOnCover?: boolean;
}

export function EpisodeCover({
  episode,
  index = 0,
  variant = "compact",
  children,
  className = "",
  showMetaOnCover = true,
}: EpisodeCoverProps) {
  const src = resolveEpisodeBackgroundSrc(episode);
  const { scale, objectPosition, accentStyle } = getEpisodeCoverVariation(index);
  const epLabel = formatEpisodeNumber(episode.number);
  const aspect =
    variant === "hero"
      ? "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[5/4]"
      : variant === "feature"
        ? "aspect-[4/5] md:aspect-[16/11]"
        : "aspect-square";

  const sizes =
    variant === "hero"
      ? "(max-width: 640px) 100vw, 480px"
      : variant === "feature"
        ? "(max-width: 768px) 100vw, 640px"
        : "112px";

  return (
    <div
      className={`relative overflow-hidden rounded-[4px] bg-cm-bg-low ${aspect} ${className}`}
    >
      <EditorialImage
        src={src}
        alt=""
        fill
        sizes={sizes}
        className="transition duration-500 ease-out"
        style={{
          objectPosition,
          transform: `scale(${scale})`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-0 top-0 w-px bg-cm-red/70"
        style={accentStyle}
        aria-hidden
      />
      {showMetaOnCover && (variant === "feature" || variant === "hero") && (
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cm-red">
            {episode.category}
          </p>
          {epLabel && (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-cm-gray">
              Ep. {epLabel}
            </p>
          )}
          <p className="mt-2 font-display text-lg leading-snug text-white md:text-xl">
            {episode.title}
          </p>
          {episode.publishedAt && variant === "hero" && (
            <p className="mt-2 text-xs text-cm-gray">{formatDateBR(episode.publishedAt)}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
