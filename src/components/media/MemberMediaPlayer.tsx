"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useMediaPlayback } from "@/components/media/MediaPlaybackProvider";
import type { MemberMediaFormat, MemberMediaItem } from "@/data/member-media";

type PlayerState = "idle" | "loading" | "playing" | "paused" | "ended" | "error" | "unavailable";

export function MemberMediaPlayer({ item }: { item: MemberMediaItem }) {
  const reactId = useId();
  const playerId = `member-${item.id}-${reactId}`;
  const { register, unregister, notifyPlay } = useMediaPlayback();
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [format, setFormat] = useState<MemberMediaFormat>(item.formats[0] ?? "audio");
  const [state, setState] = useState<PlayerState>("idle");

  const hasAudio = item.formats.includes("audio") && Boolean(item.audioUrl);
  const hasVideo = item.formats.includes("video") && Boolean(item.videoUrl);

  useEffect(() => {
    const pause = () => {
      audioRef.current?.pause();
      videoRef.current?.pause();
      setState((s) => (s === "playing" ? "paused" : s));
    };
    register(playerId, pause);
    return () => unregister(playerId);
  }, [playerId, register, unregister]);

  useEffect(() => {
    if (!item.formats.includes(format)) {
      setFormat(item.formats[0] ?? "audio");
    }
  }, [format, item.formats]);

  if (!hasAudio && !hasVideo) {
    return (
      <div className="rounded-[4px] border border-cm-divider p-4 text-sm text-cm-gray">
        Conteúdo indisponível no momento.
      </div>
    );
  }

  function onPlayIntent() {
    notifyPlay(playerId);
    setState("playing");
  }

  return (
    <article className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-4">
      <header className="space-y-1">
        <h3 className="font-semibold text-white">{item.title}</h3>
        <p className="text-sm text-cm-gray">{item.summary}</p>
        <p className="text-xs text-cm-gray">
          {item.publishedAt} · {item.duration}
          {item.progressPercent != null ? ` · ${item.progressPercent}% ouvido` : ""}
        </p>
      </header>

      {item.formats.length > 1 && (
        <div className="mt-3 flex gap-2" role="tablist" aria-label="Formato">
          {hasAudio && (
            <button
              type="button"
              role="tab"
              aria-selected={format === "audio"}
              className={`min-h-11 rounded px-3 text-sm ${format === "audio" ? "bg-cm-red text-white" : "border border-cm-divider text-cm-gray"}`}
              onClick={() => setFormat("audio")}
            >
              Áudio
            </button>
          )}
          {hasVideo && (
            <button
              type="button"
              role="tab"
              aria-selected={format === "video"}
              className={`min-h-11 rounded px-3 text-sm ${format === "video" ? "bg-cm-red text-white" : "border border-cm-divider text-cm-gray"}`}
              onClick={() => setFormat("video")}
            >
              Vídeo
            </button>
          )}
        </div>
      )}

      <div className="mt-4">
        {format === "audio" && hasAudio && (
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            src={item.audioUrl}
            className="w-full"
            onPlay={onPlayIntent}
            onWaiting={() => setState("loading")}
            onPlaying={() => setState("playing")}
            onPause={() => setState("paused")}
            onEnded={() => setState("ended")}
            onError={() => setState("error")}
          />
        )}
        {format === "video" && hasVideo && (
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            src={item.videoUrl}
            className="aspect-video w-full rounded bg-black"
            onPlay={onPlayIntent}
            onWaiting={() => setState("loading")}
            onPlaying={() => setState("playing")}
            onPause={() => setState("paused")}
            onEnded={() => setState("ended")}
            onError={() => setState("error")}
          />
        )}
      </div>

      <p className="mt-2 text-xs text-cm-gray" aria-live="polite">
        {state === "loading" && "Carregando…"}
        {state === "playing" && "Reproduzindo"}
        {state === "paused" && "Pausado"}
        {state === "ended" && "Concluído"}
        {state === "error" && "Erro ao reproduzir"}
      </p>
    </article>
  );
}

export function MemberMediaEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[4px] border border-dashed border-cm-divider px-6 py-10 text-center">
      <p className="text-sm text-cm-gray">{message}</p>
    </div>
  );
}
