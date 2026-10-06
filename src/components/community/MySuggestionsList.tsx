"use client";

import { useEffect, useState } from "react";
import type { EpisodeSuggestion } from "@/lib/community/types";

const STATUS_LABEL: Record<EpisodeSuggestion["status"], string> = {
  received: "Recebida",
  under_review: "Em análise",
  needs_information: "Precisa de informações",
  accepted: "Aceita para consideração",
  not_selected: "Não selecionada",
  closed: "Encerrada",
};

export function MySuggestionsList() {
  const [items, setItems] = useState<EpisodeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/community/suggestions")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setItems(d.suggestions ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-cm-gray">Carregando…</p>;
  if (error) {
    return (
      <p className="text-sm text-cm-red-light" role="alert">
        {error}
      </p>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-cm-gray">Você ainda não enviou sugestões.</p>;
  }

  return (
    <ul className="divide-y divide-cm-divider rounded-[4px] border border-cm-divider bg-cm-bg-low">
      {items.map((s) => (
        <li key={s.id} className="p-4">
          <p className="font-semibold text-white">{s.caseTitle}</p>
          <p className="mt-1 text-xs text-cm-gray">
            {s.protocol} · {new Date(s.createdAt).toLocaleDateString("pt-BR")} · {STATUS_LABEL[s.status]}
          </p>
          {s.memberMessage && <p className="mt-2 text-sm text-white/85">{s.memberMessage}</p>}
        </li>
      ))}
    </ul>
  );
}
