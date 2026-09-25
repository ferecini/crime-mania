"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicEpisode } from "@/data/episodes";
import { formatEpisodeNumber } from "@/data/episodes";
import { ListenAlsoLinks } from "@/components/media/ListenAlsoLinks";
import { NativeAudioPlayer, type NativeAudioPlayerHandle } from "@/components/media/NativeAudioPlayer";
import { spotifyOpenEpisodeUrl } from "@/lib/media/spotify";

type MediaSurface = "listen" | "watch";

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
    | "appleUrl"
    | "deezerShowUrl"
  >;
}

function readInitialSurface(hasVideo: boolean): MediaSurface {
  if (!hasVideo || typeof window === "undefined") return "listen";
  const params = new URLSearchParams(window.location.search);
  if (params.get("midia") === "video") return "watch";
  if (window.location.hash === "#video") return "watch";
  return "listen";
}

function MediaSkeleton() {
  return (
    <div
      className="cm-panel overflow-hidden p-0"
      role="status"
      aria-label="Carregando player"
    >
      <div className="border-b border-white/5 px-4 py-3">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      </div>
      <div className="flex min-h-[152px] items-center justify-center bg-[#121212] px-4 py-8 sm:min-h-[232px]">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-white/10" />
      </div>
    </div>
  );
}

export function EpisodePlayer({ episode }: EpisodePlayerProps) {
  const hasVideo = Boolean(episode.youtubeVideoId);
  const [surface, setSurface] = useState<MediaSurface>("listen");
  const [embedOk, setEmbedOk] = useState<boolean | null>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const nativeRef = useRef<NativeAudioPlayerHandle>(null);

  const openId = episode.spotifyOpenEpisodeId;
  const spotifyOpenUrl = openId ? spotifyOpenEpisodeUrl(openId) : episode.spotifyUrl;

  const embedSrc = useMemo(
    () => (openId ? `https://open.spotify.com/embed/episode/${openId}?utm_source=generator` : null),
    [openId],
  );

  useEffect(() => {
    setSurface(readInitialSurface(hasVideo));
  }, [hasVideo, episode.spotifyOpenEpisodeId]);

  useEffect(() => {
    nativeRef.current?.pause();
  }, [surface]);

  useEffect(() => {
    if (surface !== "listen") {
      setEmbedOk(null);
      return;
    }
    if (!openId) {
      setEmbedOk(false);
      return;
    }
    let cancelled = false;
    setEmbedOk(null);
    setEmbedLoaded(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    fetch(`/api/media/spotify-embed?id=${encodeURIComponent(openId)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean }) => {
        if (!cancelled) setEmbedOk(Boolean(data.ok));
      })
      .catch(() => {
        if (!cancelled) setEmbedOk(false);
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [openId, surface]);

  const switchSurface = useCallback((next: MediaSurface) => {
    nativeRef.current?.pause();
    setSurface(next);
  }, []);

  const epLabel = formatEpisodeNumber(episode.number);
  const subtitleParts = [episode.category, epLabel ? `Ep. ${epLabel}` : null, episode.duration].filter(
    Boolean,
  );
  const subtitle = subtitleParts.join(" · ");

  const showListenSelector = hasVideo;

  return (
    <div className="cm-player-stack space-y-4">
      {showListenSelector && (
        <div
          className="inline-flex rounded-md border border-white/10 bg-cm-bg-elevated p-0.5"
          role="tablist"
          aria-label="Modo de mídia"
        >
          <button
            type="button"
            role="tab"
            aria-selected={surface === "listen"}
            className={`min-h-9 rounded px-4 text-xs font-semibold uppercase tracking-wider transition ${
              surface === "listen"
                ? "bg-cm-red text-white"
                : "text-cm-gray hover:text-white"
            }`}
            onClick={() => switchSurface("listen")}
          >
            Ouvir
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={surface === "watch"}
            className={`min-h-9 rounded px-4 text-xs font-semibold uppercase tracking-wider transition ${
              surface === "watch"
                ? "bg-cm-red text-white"
                : "text-cm-gray hover:text-white"
            }`}
            onClick={() => switchSurface("watch")}
          >
            Assistir
          </button>
        </div>
      )}

      {surface === "watch" && episode.youtubeVideoId && (
        <div key={`yt-${episode.youtubeVideoId}`} className="cm-panel overflow-hidden p-0">
          <div className="aspect-video min-h-[200px] bg-black sm:min-h-[240px]">
            <iframe
              title={`Vídeo — ${episode.title}`}
              src={`https://www.youtube-nocookie.com/embed/${episode.youtubeVideoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {surface === "listen" && embedOk === null && openId && <MediaSkeleton />}

      {surface === "listen" && embedOk === true && embedSrc && (
        <div key={`sp-${openId}`} className="cm-panel cm-panel-glow overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cm-gray">Spotify</p>
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

      {surface === "listen" && embedOk === false && (
        <div key={`native-${episode.spotifyOpenEpisodeId}`} className="space-y-3">
          {episode.audioUrl ? (
            <NativeAudioPlayer
              ref={nativeRef}
              src={episode.audioUrl}
              title={episode.title}
              subtitle={subtitle}
            />
          ) : (
            <div className="cm-panel p-4">
              <p className="text-sm text-cm-gray">
                Player incorporado indisponível e áudio RSS não encontrado para este episódio.
              </p>
            </div>
          )}
          {spotifyOpenUrl && (
            <p className="text-center text-sm sm:text-left">
              <a
                href={spotifyOpenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cm-red-light underline-offset-2 hover:underline"
              >
                Abrir no Spotify
              </a>
            </p>
          )}
        </div>
      )}

      <ListenAlsoLinks episode={episode} />
    </div>
  );
}
