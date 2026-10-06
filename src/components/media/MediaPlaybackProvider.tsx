"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type PauseFn = () => void;

interface MediaPlaybackContextValue {
  register: (id: string, pause: PauseFn) => void;
  unregister: (id: string) => void;
  notifyPlay: (id: string) => void;
}

const MediaPlaybackContext = createContext<MediaPlaybackContextValue | null>(null);

export function MediaPlaybackProvider({ children }: { children: ReactNode }) {
  const playersRef = useRef(new Map<string, PauseFn>());

  const register = useCallback((id: string, pause: PauseFn) => {
    playersRef.current.set(id, pause);
  }, []);

  const unregister = useCallback((id: string) => {
    playersRef.current.delete(id);
  }, []);

  const notifyPlay = useCallback((id: string) => {
    for (const [playerId, pause] of playersRef.current) {
      if (playerId !== id) pause();
    }
  }, []);

  const value = useMemo(
    () => ({ register, unregister, notifyPlay }),
    [register, unregister, notifyPlay],
  );

  return <MediaPlaybackContext.Provider value={value}>{children}</MediaPlaybackContext.Provider>;
}

export function useMediaPlayback() {
  const ctx = useContext(MediaPlaybackContext);
  if (!ctx) {
    throw new Error("useMediaPlayback must be used within MediaPlaybackProvider");
  }
  return ctx;
}
