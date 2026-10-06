"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DossierManifestPublicBlock } from "@/lib/dossier/types";

function blockSrc(slug: string, blockId: string) {
  return `/api/dossier/${encodeURIComponent(slug)}/blocks/${encodeURIComponent(blockId)}?w=1440&fmt=webp`;
}

export function DossierBlockLightbox({
  slug,
  blockId,
  block,
  onClose,
}: {
  slug: string;
  blockId: string;
  block: DossierManifestPublicBlock;
  widths: number[];
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
      role="dialog"
      aria-modal="true"
      aria-label={block.altText}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 px-4 py-2">
        <p className="truncate text-sm text-cm-gray">{block.label ?? block.altText}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-[4px] border border-cm-divider px-3 text-sm text-white"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          >
            +
          </button>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-[4px] border border-cm-divider px-3 text-sm text-white"
            onClick={() => setScale((s) => Math.max(1, s - 0.25))}
          >
            −
          </button>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-[4px] border border-cm-divider px-3 text-sm text-white"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
      <div
        className="flex flex-1 touch-none items-center justify-center overflow-hidden px-2"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={blockSrc(slug, blockId)}
          alt={block.altText}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  );
}
