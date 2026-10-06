"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Item = {
  id: string;
  section: string;
  title: string;
  mediaType: string;
  status: string;
  accessTier: string;
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({
    section: "juris" as "episodes" | "juris" | "archive",
    title: "",
    mediaType: "audio" as "audio" | "video",
    accessTier: "tier2" as "tier1" | "tier2",
    streamPath: "",
    dossierSlug: "",
  });

  const load = () =>
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: form.section,
        title: form.title,
        mediaType: form.mediaType,
        accessTier: form.accessTier,
        streamPath: form.streamPath || null,
        dossierSlug: form.dossierSlug || null,
        provider: "blob",
        status: "draft",
      }),
    });
    setForm({ ...form, title: "", streamPath: "", dossierSlug: "" });
    load();
  }

  return (
    <div className="space-y-8">
      <section className="rounded border border-cm-divider p-4">
        <h2 className="text-sm font-semibold text-white">Cadastrar mídia premium</h2>
        <p className="mt-1 text-xs text-cm-gray">Sem YouTube para conteúdo pago. Use blob ou stream interno.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select
            className="cm-input min-h-11"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value as typeof form.section })}
          >
            <option value="episodes">Episódios premium</option>
            <option value="juris">Crime Mania Juris</option>
            <option value="archive">Arquivo</option>
          </select>
          <select
            className="cm-input min-h-11"
            value={form.mediaType}
            onChange={(e) => setForm({ ...form, mediaType: e.target.value as "audio" | "video" })}
          >
            <option value="audio">Áudio</option>
            <option value="video">Vídeo</option>
          </select>
          <input
            className="cm-input min-h-11 sm:col-span-2"
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="cm-input min-h-11 sm:col-span-2"
            placeholder="Caminho stream / storage (sem URL pública)"
            value={form.streamPath}
            onChange={(e) => setForm({ ...form, streamPath: e.target.value })}
          />
          <input
            className="cm-input min-h-11"
            placeholder="Dossiê (slug opcional)"
            value={form.dossierSlug}
            onChange={(e) => setForm({ ...form, dossierSlug: e.target.value })}
          />
        </div>
        <Button type="button" className="mt-3 min-h-11" onClick={save}>
          Salvar rascunho
        </Button>
      </section>
      <ul className="divide-y divide-cm-divider rounded border border-cm-divider text-sm">
        {items.map((it) => (
          <li key={it.id} className="p-4">
            <p className="text-white">{it.title}</p>
            <p className="text-cm-gray">
              {it.section} · {it.mediaType} · {it.status} · {it.accessTier}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
