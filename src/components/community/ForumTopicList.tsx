"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { CommunityTopic } from "@/lib/community/types";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function ForumTopicList() {
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (append: boolean, cur?: string) => {
    setError(null);
    if (!append) setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "20" });
      if (cur) qs.set("cursor", cur);
      const res = await fetch(`/api/community/topics?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setTopics((prev) => (append ? [...prev, ...data.topics] : data.topics));
      setNextCursor(data.nextCursor);
      setCursor(cur);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  if (loading && topics.length === 0) {
    return <p className="text-sm text-cm-gray">Carregando tópicos…</p>;
  }

  if (error && topics.length === 0) {
    return (
      <p className="text-sm text-cm-red-light" role="alert">
        {error}
      </p>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6 text-sm text-cm-gray">
        Nenhum tópico ainda. Seja o primeiro a iniciar um debate.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-cm-divider rounded-[4px] border border-cm-divider bg-cm-bg-low">
        {topics.map((t) => (
          <li key={t.id} className="p-4">
            <Link href={`/membro/comunidade/forum/${t.id}`} className="block min-h-11">
              <div className="flex flex-wrap items-center gap-2 text-xs text-cm-gray">
                {t.isPinned && (
                  <span className="rounded bg-cm-red/20 px-2 py-0.5 font-semibold text-cm-red-light">
                    Fixado
                  </span>
                )}
                <span>{t.categoryLabel ?? "Geral"}</span>
                <span aria-hidden>·</span>
                <span>{t.authorDisplayName ?? "Membro"}</span>
                {t.status === "closed" && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="text-amber-400/90">Fechado</span>
                  </>
                )}
              </div>
              <h3 className="mt-1 text-base font-semibold text-white">{t.title}</h3>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-cm-gray">
                <span>{t.replyCount} respostas</span>
                <span>Atividade {formatWhen(t.lastActivityAt)}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {nextCursor && nextCursor !== cursor && (
        <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto" onClick={() => load(true, nextCursor)}>
          Carregar mais
        </Button>
      )}
      {error && (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
