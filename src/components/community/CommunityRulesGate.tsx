"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function CommunityRulesGate({ onAccepted }: { onAccepted: () => void }) {
  const [rulesMarkdown, setRulesMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/community/rules");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro");
        if (data.accepted) {
          onAccepted();
          return;
        }
        if (!cancelled) setRulesMarkdown(data.rulesMarkdown ?? "");
      } catch {
        if (!cancelled) setError("Não foi possível carregar as regras.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onAccepted]);

  async function accept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/community/rules", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      onAccepted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao aceitar.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-cm-gray">Carregando regras…</p>;
  }

  return (
    <div className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
      <h2 className="text-lg font-semibold text-white">Regras da comunidade</h2>
      <p className="mt-2 text-xs text-cm-gray">Texto provisório — revisão editorial antes da abertura pública.</p>
      <div className="prose prose-invert mt-4 max-w-none whitespace-pre-wrap text-sm text-white/85">
        {rulesMarkdown}
      </div>
      {error && (
        <p className="mt-3 text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      )}
      <Button type="button" className="mt-6 min-h-11" disabled={accepting} onClick={accept}>
        {accepting ? "Registrando…" : "Li e aceito as regras"}
      </Button>
    </div>
  );
}
