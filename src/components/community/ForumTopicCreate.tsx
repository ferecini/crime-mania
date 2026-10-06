"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityRulesGate } from "@/components/community/CommunityRulesGate";
import {
  clearCommunityDraft,
  CommunityTextarea,
  useCommunityDraft,
} from "@/components/community/CommunityTextarea";
import { Button } from "@/components/ui/Button";
import type { CommunityCategory } from "@/lib/community/types";

export function ForumTopicCreate() {
  const router = useRouter();
  const [rulesOk, setRulesOk] = useState(false);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useCommunityDraft("topic-title");
  const [body, setBody] = useCommunityDraft("topic-body");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRulesAccepted = useCallback(() => setRulesOk(true), []);

  useEffect(() => {
    if (!rulesOk) return;
    fetch("/api/community/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
        if (d.categories?.[0]) setCategoryId(d.categories[0].id);
      })
      .catch(() => setError("Não foi possível carregar categorias."));
  }, [rulesOk]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (publishing) return;
    setError(null);
    setPublishing(true);
    try {
      const res = await fetch("/api/community/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, categoryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      clearCommunityDraft("topic-title");
      clearCommunityDraft("topic-body");
      router.push(`/membro/comunidade/forum/${data.topic.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar.");
    } finally {
      setPublishing(false);
    }
  }

  if (!rulesOk) {
    return <CommunityRulesGate onAccepted={onRulesAccepted} />;
  }

  return (
    <form onSubmit={publish} className="mx-auto max-w-2xl space-y-4">
      <p className="text-sm text-cm-gray">
        <Link href="/membro/comunidade/regras" className="cm-text-link">
          Ver regras da comunidade
        </Link>
      </p>
      <label className="block text-sm">
        <span className="mb-1.5 block text-cm-gray">Categoria</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="cm-input min-h-11 w-full"
          required
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-cm-gray">Título</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          required
          minLength={3}
          className="cm-input min-h-11 w-full"
        />
        <span className="mt-1 block text-xs text-cm-gray">{title.length}/120</span>
      </label>
      <CommunityTextarea
        id="topic-body"
        label="Mensagem inicial"
        value={body}
        onChange={setBody}
        maxLength={8000}
        hint="Parágrafos, listas e links http(s). Sem HTML."
      />
      {error && (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={publishing} className="min-h-11">
          {publishing ? "Publicando…" : "Publicar tópico"}
        </Button>
        <Link
          href="/membro/comunidade/forum"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-cm-gray hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
