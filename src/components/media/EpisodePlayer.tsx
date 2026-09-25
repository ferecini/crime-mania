"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicEpisode } from "@/data/episodes";
import { NativeAudioPlayer } from "@/components/media/NativeAudioPlayer";
import { spotifyOpenEpisodeUrl } from "@/lib/media/spotify";

interface EpisodePlayerProps {
  episode: Pick<
    PublicEpisode,
    | "title"
    | "category"
    | "number"
    | "duration"
    | "spotifyUrl"
    | "spotifyOpenEpisodeId"
    | "audioUrl"
    | "youtubeVideoId"
  >;
}

export function EpisodePlayer({ episode }: EpisodePlayerProps) {
  const [embedOk, setEmbedOk] = useState<boolean | null>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);

  const openId = episode.spotifyOpenEpisodeId;
  const spotifyOpenUrl = openId ? spotifyOpenEpisodeUrl(openId) : episode.spotifyUrl;

  const embedSrc = useMemo(
    () => (openId ? `https://open.spotify.com/embed/episode/${openId}?utm_source=generator` : null),
    [openId],
  );

  useEffect(() => {
    if (!openId) {
      setEmbedOk(false);
      return;
    }
    let cancelled = false;
    setEmbedOk(null);
    setEmbedLoaded(false);
    fetch(`/api/media/spotify-embed?id=${encodeURIComponent(openId)}`)
      .then((r) => r.json())
      .then((data: { ok?: boolean }) => {
        if (!cancelled) setEmbedOk(Boolean(data.ok));
      })
      .catch(() => {
        if (!cancelled) setEmbedOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openId]);

  const subtitle = `${episode.category} · Ep. ${String(episode.number).padStart(3, "0")} · ${episode.duration}`;

  return (
    <div className="cm-player-stack space-y-4">
      <NativeAudioPlayer src={episode.audioUrl} title={episode.title} subtitle={subtitle} />

      {embedOk === null && openId && (
        <div className="cm-panel px-4 py-3 text-sm text-cm-gray" role="status">
          Verificando player Spotify…
        </div>
      )}

      {embedOk && embedSrc && (
        <div className="cm-panel cm-panel-glow overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cm-gray">
              Spotify
            </p>
            <a
              href={spotifyOpenUrl}
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
                <span className="text-sm text-cm-gray">Carregando Spotify…</span>
              </div>
            )}
            <iframe
              title={`Spotify — ${episode.title}`}
              src={embedSrc}
              width="100%"
              height="232"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="relative z-[1] block w-full border-0"
              onLoad={() => setEmbedLoaded(true)}
            />
          </div>
        </div>
      )}

      {embedOk === false && (
        <div className="cm-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-cm-gray">
            Player incorporado indisponível para este episódio. Ouça acima ou abra no Spotify.
          </p>
          <a
            href={spotifyOpenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-cm-red px-5 text-sm font-semibold text-white hover:bg-cm-red-light"
          >
            Ouvir no Spotify
          </a>
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
