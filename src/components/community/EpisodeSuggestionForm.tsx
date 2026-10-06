"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CommunityTextarea, clearCommunityDraft, useCommunityDraft } from "@/components/community/CommunityTextarea";
import { Button } from "@/components/ui/Button";

function randomToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function EpisodeSuggestionForm() {
  const router = useRouter();
  const [caseTitle, setCaseTitle] = useCommunityDraft("sug-title");
  const [location, setLocation] = useCommunityDraft("sug-loc");
  const [summary, setSummary] = useCommunityDraft("sug-summary");
  const [relevance, setRelevance] = useCommunityDraft("sug-relevance");
  const [linksText, setLinksText] = useCommunityDraft("sug-links");
  const [sensitive, setSensitive] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ protocol: string; similar?: { caseTitle: string }[] } | null>(
    null,
  );
  const clientToken = useMemo(() => randomToken(), []);

  const sourceLinks = linksText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !confirmed) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseTitle,
          location: location || undefined,
          summary,
          relevance,
          sourceLinks,
          sensitiveContent: sensitive,
          noPrivateDataConfirmed: true,
          clientToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      clearCommunityDraft("sug-title");
      clearCommunityDraft("sug-loc");
      clearCommunityDraft("sug-summary");
      clearCommunityDraft("sug-relevance");
      clearCommunityDraft("sug-links");
      setSuccess({ protocol: data.suggestion.protocol, similar: data.similar });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 p-6" role="status">
        <p className="text-lg font-semibold text-white">Sugestão recebida</p>
        <p className="mt-2 text-sm text-white/90">
          Protocolo <span className="font-mono">{success.protocol}</span>. A equipe analisará o material — isso não
          garante produção de episódio.
        </p>
        {success.similar && success.similar.length > 0 && (
          <p className="mt-3 text-sm text-cm-gray">
            Encontramos sugestões com título parecido (apenas informativo):{" "}
            {success.similar.map((s) => s.caseTitle).join("; ")}
          </p>
        )}
        <Link href="/membro/comunidade/sugira/minhas" className="cm-text-link mt-4 inline-flex min-h-11 items-center text-sm font-semibold">
          Ver minhas sugestões →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block text-cm-gray">Título ou nome do caso</span>
        <input
          value={caseTitle}
          onChange={(e) => setCaseTitle(e.target.value.slice(0, 160))}
          required
          minLength={3}
          className="cm-input min-h-11 w-full"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-cm-gray">País, estado ou cidade (opcional)</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value.slice(0, 160))}
          className="cm-input min-h-11 w-full"
        />
      </label>
      <CommunityTextarea id="s-summary" label="Resumo da sugestão" value={summary} onChange={setSummary} maxLength={4000} />
      <CommunityTextarea
        id="s-rel"
        label="Por que seria relevante para o Crime Mania?"
        value={relevance}
        onChange={setRelevance}
        maxLength={2000}
      />
      <CommunityTextarea
        id="s-links"
        label="Links de fontes públicas (um por linha, até 8)"
        value={linksText}
        onChange={setLinksText}
        maxLength={2048}
        rows={4}
      />
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} className="mt-1" />
        <span className="text-cm-gray">Este caso pode envolver conteúdo sensível ou perturbador.</span>
      </label>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          required
          className="mt-1"
        />
        <span className="text-cm-gray">
          Confirmo que não incluí dados pessoais privados de vítimas, familiares ou suspeitos.
        </span>
      </label>
      {error && (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting || !confirmed} className="min-h-11 w-full sm:w-auto">
        {submitting ? "Enviando…" : "Enviar sugestão"}
      </Button>
    </form>
  );
}
