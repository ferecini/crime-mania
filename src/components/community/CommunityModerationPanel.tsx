"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { EpisodeSuggestion } from "@/lib/community/types";

export function CommunityModerationPanel() {
  const [reports, setReports] = useState<
    { id: string; targetType: string; targetId: string; reason: string; createdAt: string }[]
  >([]);
  const [suggestions, setSuggestions] = useState<EpisodeSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/community/admin/moderate");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setReports(data.reports ?? []);
      setSuggestions(data.suggestions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function mod(action: string, targetId: string, extra?: Record<string, string>) {
    const res = await fetch("/api/community/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Falha na moderação");
      return;
    }
    await load();
  }

  if (loading) return <p className="text-sm text-cm-gray">Carregando painel…</p>;
  if (error) {
    return (
      <p className="text-sm text-cm-red-light" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-white">Denúncias pendentes</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-cm-gray">Nenhuma denúncia na fila.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded border border-cm-divider p-4 text-sm">
                <p>
                  {r.targetType} · {r.reason} · {r.targetId}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.targetType === "topic" && (
                    <>
                      <Button type="button" variant="secondary" className="min-h-11" onClick={() => mod("hide_topic", r.targetId, { reason: r.reason })}>
                        Ocultar tópico
                      </Button>
                      <Button type="button" variant="secondary" className="min-h-11" onClick={() => mod("close_topic", r.targetId, { reason: r.reason })}>
                        Fechar tópico
                      </Button>
                    </>
                  )}
                  {r.targetType === "reply" && (
                    <Button type="button" variant="secondary" className="min-h-11" onClick={() => mod("hide_reply", r.targetId, { reason: r.reason })}>
                      Ocultar resposta
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white">Sugestões de episódio</h2>
        <ul className="mt-4 space-y-4">
          {suggestions.map((s) => (
            <li key={s.id} className="rounded border border-cm-divider p-4 text-sm">
              <p className="font-semibold text-white">{s.caseTitle}</p>
              <p className="text-xs text-cm-gray">
                {s.protocol} · {s.status} · {new Date(s.createdAt).toLocaleString("pt-BR")}
              </p>
              <p className="mt-2 text-cm-gray">{s.summary.slice(0, 200)}…</p>
              {s.sourceLinks.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {s.sourceLinks.map((href) => (
                    <li key={href}>
                      <a href={href} target="_blank" rel="noopener noreferrer" className="cm-text-link break-all">
                        {href}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {(["under_review", "needs_information", "accepted", "not_selected", "closed"] as const).map((st) => (
                  <Button
                    key={st}
                    type="button"
                    variant="secondary"
                    className="min-h-11 text-xs"
                    onClick={() =>
                      mod("update_suggestion", s.id, {
                        suggestionStatus: st,
                        memberMessage: `Status atualizado: ${st.replace(/_/g, " ")}`,
                      })
                    }
                  >
                    {st}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
