"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CommunityNotification } from "@/lib/community/types";

export function CommunityNotificationsList() {
  const [items, setItems] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/community/notifications/${id}/read`, { method: "POST" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  }

  if (loading) return <p className="text-sm text-cm-gray">Carregando…</p>;
  if (items.length === 0) return <p className="text-sm text-cm-gray">Sem notificações.</p>;

  return (
    <ul className="space-y-3">
      {items.map((n) => (
        <li
          key={n.id}
          className={`rounded-[4px] border border-cm-divider p-4 ${n.readAt ? "opacity-70" : "bg-cm-bg-low"}`}
        >
          <p className="font-semibold text-white">{n.title}</p>
          <p className="mt-1 text-sm text-cm-gray">{n.body}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {n.linkHref && (
              <Link href={n.linkHref} className="cm-text-link min-h-11 inline-flex items-center text-sm font-semibold">
                Abrir
              </Link>
            )}
            {!n.readAt && (
              <button
                type="button"
                className="min-h-11 text-sm font-semibold text-cm-gray hover:text-white"
                onClick={() => markRead(n.id)}
              >
                Marcar como lida
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
