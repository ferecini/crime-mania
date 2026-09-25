"use client";

import { useMemo, useState } from "react";
import type { PublicEpisode } from "@/data/episodes";

interface EpisodePlayerProps {
  episode: Pick<
    PublicEpisode,
    "title" | "spotifyEpisodeId" | "spotifyUrl" | "youtubeVideoId" | "audioUrl"
  >;
}

export function EpisodePlayer({ episode }: EpisodePlayerProps) {
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const spotifyEmbedSrc = useMemo(
    () =>
      `https://open.spotify.com/embed/episode/${episode.spotifyEpisodeId}?utm_source=generator`,
    [episode.spotifyEpisodeId],
  );

  return (
    <div className="cm-player-stack space-y-4">
      <div className="cm-panel cm-panel-glow overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cm-gray">
            Spotify
          </p>
          <a
            href={episode.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-cm-red-light transition hover:text-white"
          >
            Abrir no Spotify
          </a>
        </div>
        <div className="relative min-h-[232px] bg-[#121212]">
          {!embedLoaded && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]"
              aria-hidden
            >
              <span className="text-sm text-cm-gray">Carregando player…</span>
            </div>
          )}
          <iframe
            title={`Spotify — ${episode.title}`}
            src={spotifyEmbedSrc}
            width="100%"
            height="232"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            className="relative z-[1] block w-full border-0"
            onLoad={() => setEmbedLoaded(true)}
          />
        </div>
      </div>

      {episode.audioUrl && (
        <div className="cm-panel p-4 md:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cm-gray">
            Ouvir no site
          </p>
          <audio
            controls
            preload="metadata"
            className="cm-audio w-full"
            src={episode.audioUrl}
          >
            Seu navegador não suporta áudio HTML5.
          </audio>
        </div>
      )}

      {episode.youtubeVideoId && (
        <div className="cm-panel overflow-hidden p-0">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cm-gray">
              YouTube
            </p>
          </div>
          <div className="aspect-video bg-black">
            <iframe
              title={`YouTube — ${episode.title}`}
              src={`https://www.youtube-nocookie.com/embed/${episode.youtubeVideoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
