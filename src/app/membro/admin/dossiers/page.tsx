"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Row = { slug: string; title: string; category: string; accessTier: string; source: string };

export default function AdminDossiersListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [accessTier, setAccessTier] = useState<"tier1" | "tier2">("tier1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dossier/catalog")
      .then((r) => r.json())
      .then((d) => setRows(d.dossiers ?? []))
      .catch(() => setError("Falha ao carregar."));
  }, []);

  async function createDossier() {
    setError(null);
    const res = await fetch("/api/admin/dossier/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, accessTier }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro");
      return;
    }
    setSlug("");
    setTitle("");
    const list = await fetch("/api/admin/dossier/catalog").then((r) => r.json());
    setRows(list.dossiers ?? []);
  }

  return (
    <div className="space-y-8">
      <section className="rounded border border-cm-divider p-4">
        <h2 className="text-sm font-semibold text-white">Novo dossiê (sem PDF)</h2>
        <p className="mt-1 text-xs text-cm-gray">
          Cria o registro no catálogo; depois abra “Editar dossiê” e clique em “Criar dossiê em branco”. Slug: minúsculas,
          números e hífens (ex.: caso-fulano).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input className="cm-input min-h-11" placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <input className="cm-input min-h-11" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select
            className="cm-input min-h-11"
            aria-label="Plano com acesso"
            value={accessTier}
            onChange={(e) => setAccessTier(e.target.value as "tier1" | "tier2")}
          >
            <option value="tier1">Acesso: plano 1 e 2</option>
            <option value="tier2">Acesso: somente plano 2</option>
          </select>
        </div>
        <Button type="button" className="mt-3 min-h-11" onClick={createDossier}>
          Criar registro
        </Button>
        {error && <p className="mt-2 text-sm text-cm-red-light">{error}</p>}
      </section>
      <ul className="divide-y divide-cm-divider rounded border border-cm-divider">
        {rows.map((d) => (
          <li key={d.slug} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-white">{d.title}</p>
              <p className="text-xs text-cm-gray">
                {d.slug} · {d.accessTier} · {d.source}
              </p>
            </div>
            <Link
              href={`/membro/admin/dossiers/${d.slug}`}
              className="inline-flex min-h-11 items-center text-sm text-cm-red-light hover:text-white"
            >
              Editar dossiê →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
