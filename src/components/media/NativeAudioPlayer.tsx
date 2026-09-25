"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface NativeAudioPlayerHandle {
  pause: () => void;
}

interface NativeAudioPlayerProps {
  src: string;
  title: string;
  subtitle?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const NativeAudioPlayer = forwardRef<NativeAudioPlayerHandle, NativeAudioPlayerProps>(
  function NativeAudioPlayer({ src, title, subtitle }, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setStatus("loading");
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  useImperativeHandle(ref, () => ({
    pause: () => {
      const el = audioRef.current;
      if (!el) return;
      el.pause();
      setPlaying(false);
    },
  }));

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el || status === "error") return;
    if (el.paused) {
      try {
        await el.play();
        setPlaying(true);
      } catch {
        setStatus("error");
      }
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [status]);

  return (
    <div className="cm-panel p-4 md:p-5" aria-label={`Player de áudio — ${title}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cm-gray">
            Ouvir no site
          </p>
          <p className="mt-1 font-medium text-white">{title}</p>
          {subtitle && <p className="text-xs text-cm-gray">{subtitle}</p>}
        </div>
        {status === "loading" && (
          <span className="text-xs text-cm-gray" role="status">
            Carregando áudio…
          </span>
        )}
      </div>

      {status === "error" ? (
        <p className="text-sm text-cm-red-light" role="alert">
          Não foi possível carregar este episódio agora. Use o link Abrir no Spotify.
        </p>
      ) : (
        <>
          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
            className="sr-only"
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setStatus("ready");
            }}
            onCanPlay={() => setStatus("ready")}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
            onError={() => setStatus("error")}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              disabled={status === "loading"}
              aria-label={playing ? "Pausar" : "Reproduzir"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cm-red text-white shadow-[0_8px_24px_rgba(144,2,0,0.35)] transition hover:bg-cm-red-light disabled:opacity-50"
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <div className="min-w-0 flex-1">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={current}
                aria-label="Progresso da reprodução"
                className="w-full accent-[#900200]"
                onChange={(e) => {
                  const el = audioRef.current;
                  if (!el) return;
                  const next = Number(e.target.value);
                  el.currentTime = next;
                  setCurrent(next);
                }}
              />
              <div className="mt-1 flex justify-between text-[11px] tabular-nums text-cm-gray">
                <span>{formatTime(current)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
},
);
