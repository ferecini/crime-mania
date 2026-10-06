"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityRulesGate } from "@/components/community/CommunityRulesGate";
import {
  clearCommunityDraft,
  CommunityTextarea,
  useCommunityDraft,
} from "@/components/community/CommunityTextarea";
import { CommunityBody } from "@/lib/community/format-body";
import { Button } from "@/components/ui/Button";
import { REPORT_REASONS, type CommunityReply, type CommunityTopic } from "@/lib/community/types";

const REPORT_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  personal_data: "Exposição de dados pessoais",
  unsourced_accusation: "Acusação sem fonte",
  victim_disrespect: "Desrespeito a vítimas/familiares",
  harassment: "Assédio ou discurso ofensivo",
  spam: "Spam",
  other: "Outro",
};

export function ForumTopicView({ topicId, currentUserId }: { topicId: string; currentUserId: string }) {
  const router = useRouter();
  const [rulesOk, setRulesOk] = useState(false);
  const [topic, setTopic] = useState<CommunityTopic | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useCommunityDraft(`reply-${topicId}`);
  const [posting, setPosting] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [reportOpen, setReportOpen] = useState<null | { type: "topic" | "reply"; id: string }>(null);
  const [reportReason, setReportReason] = useState<(typeof REPORT_REASONS)[number]>("spam");

  const onRulesAccepted = useCallback(() => setRulesOk(true), []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/community/topics/${topicId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setTopic(data.topic);
      setReplies(data.replies ?? []);
      setEditTitle(data.topic.title);
      setEditBody(data.topic.body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (!rulesOk) return;
    load();
  }, [rulesOk, load]);

  async function postReply(e: React.FormEvent) {
    e.preventDefault();
    if (posting || !topic || topic.status !== "open") return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/topics/${topicId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      clearCommunityDraft(`reply-${topicId}`);
      setReplyBody("");
      setReplies((prev) => [...prev, data.reply]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao responder.");
    } finally {
      setPosting(false);
    }
  }

  async function saveTopicEdit() {
    if (!topic) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/community/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setTopic(data.topic);
      setEditingTopic(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao editar.");
    } finally {
      setPosting(false);
    }
  }

  async function submitReport() {
    if (!reportOpen) return;
    try {
      const res = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: reportOpen.type,
          targetId: reportOpen.id,
          reason: reportReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setReportOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao denunciar.");
    }
  }

  if (!rulesOk) {
    return <CommunityRulesGate onAccepted={onRulesAccepted} />;
  }

  if (loading) return <p className="text-sm text-cm-gray">Carregando…</p>;
  if (error && !topic) {
    return (
      <p className="text-sm text-cm-red-light" role="alert">
        {error}
      </p>
    );
  }
  if (!topic) return null;

  const isAuthor = topic.authorId === currentUserId;

  return (
    <div className="space-y-8">
      <article className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
        <div className="flex flex-wrap gap-2 text-xs text-cm-gray">
          <span>{topic.categoryLabel}</span>
          <span>·</span>
          <span>{topic.authorDisplayName}</span>
          {topic.status === "closed" && <span className="text-amber-400/90">· Fechado</span>}
        </div>
        {editingTopic && isAuthor ? (
          <div className="mt-4 space-y-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value.slice(0, 120))}
              className="cm-input min-h-11 w-full text-lg font-semibold"
            />
            <CommunityTextarea
              id="edit-body"
              label="Conteúdo"
              value={editBody}
              onChange={setEditBody}
              maxLength={8000}
            />
            <div className="flex gap-2">
              <Button type="button" className="min-h-11" disabled={posting} onClick={saveTopicEdit}>
                Salvar
              </Button>
              <Button type="button" variant="secondary" className="min-h-11" onClick={() => setEditingTopic(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mt-2 text-xl font-semibold text-white">{topic.title}</h1>
            <div className="mt-4">
              <CommunityBody text={topic.body} />
            </div>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {isAuthor && !editingTopic && topic.status !== "removed" && (
            <button
              type="button"
              className="min-h-11 text-sm font-semibold text-cm-gray hover:text-white"
              onClick={() => setEditingTopic(true)}
            >
              Editar
            </button>
          )}
          <button
            type="button"
            className="min-h-11 text-sm font-semibold text-cm-gray hover:text-white"
            onClick={() => setReportOpen({ type: "topic", id: topic.id })}
          >
            Denunciar
          </button>
        </div>
      </article>

      <section aria-labelledby="replies-heading">
        <h2 id="replies-heading" className="text-lg font-semibold text-white">
          Respostas ({replies.length})
        </h2>
        <ul className="mt-4 space-y-4">
          {replies.map((r) => (
            <li key={r.id} className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-4">
              <p className="text-xs text-cm-gray">{r.authorDisplayName}</p>
              <div className="mt-2">
                <CommunityBody text={r.body} />
              </div>
              <button
                type="button"
                className="mt-3 min-h-11 text-xs font-semibold text-cm-gray hover:text-white"
                onClick={() => setReportOpen({ type: "reply", id: r.id })}
              >
                Denunciar
              </button>
            </li>
          ))}
        </ul>
      </section>

      {topic.status === "open" ? (
        <form onSubmit={postReply} className="max-w-2xl space-y-3">
          <CommunityTextarea
            id="reply"
            label="Sua resposta"
            value={replyBody}
            onChange={setReplyBody}
            maxLength={6000}
            disabled={posting}
          />
          {error && (
            <p className="text-sm text-cm-red-light" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={posting || replyBody.trim().length < 2} className="min-h-11">
            {posting ? "Enviando…" : "Publicar resposta"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-cm-gray">Este tópico está fechado para novas respostas.</p>
      )}

      {reportOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cm-divider bg-cm-bg p-4 md:static md:rounded-[4px] md:border">
          <p className="text-sm font-semibold text-white">Denunciar conteúdo</p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value as (typeof REPORT_REASONS)[number])}
            className="cm-input mt-2 min-h-11 w-full"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {REPORT_LABELS[r]}
              </option>
            ))}
          </select>
          <div className="mt-3 flex gap-2">
            <Button type="button" className="min-h-11" onClick={submitReport}>
              Enviar denúncia
            </Button>
            <Button type="button" variant="secondary" className="min-h-11" onClick={() => setReportOpen(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
