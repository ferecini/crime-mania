"use client";

import { useState, type ReactNode } from "react";
import {
  CASE_FORM_LIMITS,
  newCaseId,
  type CaseImage,
  type CasePerson,
  type CasePhase,
  type DossierCaseForm,
} from "@/lib/dossier/case-form";
import type { DossierDocument, TimelineEntry } from "@/lib/dossier/document-types";
import {
  DossierDocumentActions,
  type DocumentSaveHandler,
  type DocumentVersionSummary,
} from "@/components/dossier/DossierDocumentActions";
import { Button } from "@/components/ui/Button";

const INPUT = "cm-input mt-1 min-h-11 w-full";

async function uploadImage(slug: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("assetId", newCaseId("img"));
  const res = await fetch(`/api/admin/dossier/${slug}/document/assets`, { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Falha no upload.");
  return data.assetId as string;
}

function move<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= items.length) return items;
  const copy = items.slice();
  [copy[index], copy[to]] = [copy[to]!, copy[index]!];
  return copy;
}

function replaceAt<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs text-cm-gray">
      {label}
      <input
        className={INPUT}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="mt-1 block text-[11px]">{hint}</span> : null}
    </label>
  );
}

function AreaField({
  label,
  value,
  onChange,
  hint,
  rows = 5,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="block text-xs text-cm-gray">
      {label}
      <textarea
        className="cm-input mt-1 w-full text-base leading-relaxed"
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="mt-1 block text-[11px]">{hint}</span> : null}
    </label>
  );
}

function Panel({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="rounded border border-cm-divider">
      <summary className="min-h-11 cursor-pointer px-4 py-3">
        <span className="font-semibold text-white">{title}</span>
        {description ? <span className="mt-1 block text-xs text-cm-gray">{description}</span> : null}
      </summary>
      <div className="space-y-4 border-t border-cm-divider p-4">{children}</div>
    </details>
  );
}

function RowControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const btn = "min-h-11 min-w-11 rounded border border-cm-divider px-3 text-sm disabled:opacity-40";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={btn} aria-label="Mover para cima" disabled={index === 0} onClick={() => onMove(-1)}>
        ↑
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Mover para baixo"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        ↓
      </button>
      <button type="button" className={`${btn} border-cm-red/40 text-cm-red-light`} onClick={onRemove}>
        Remover
      </button>
    </div>
  );
}

function Thumb({ slug, assetId, alt }: { slug: string; assetId: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/dossier/${slug}/document/asset/${encodeURIComponent(assetId)}?w=480`}
      alt={alt}
      className="max-h-40 w-auto max-w-full rounded border border-cm-divider object-contain"
    />
  );
}

function ImageUpload({
  slug,
  label,
  onUploaded,
}: {
  slug: string;
  label: string;
  onUploaded: (assetId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <label
        className={`inline-flex min-h-11 cursor-pointer items-center rounded-[4px] border border-cm-divider px-4 text-sm text-white hover:border-cm-gray ${busy ? "opacity-50" : ""}`}
      >
        {busy ? "Enviando…" : label}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError(null);
            try {
              onUploaded(await uploadImage(slug, file));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Falha no upload.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error ? (
        <p className="text-xs text-cm-red-light" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ImageListEditor({
  slug,
  images,
  onChange,
}: {
  slug: string;
  images: CaseImage[];
  onChange: (images: CaseImage[]) => void;
}) {
  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div key={`${img.assetId}-${i}`} className="grid gap-3 rounded border border-cm-divider/80 p-3 md:grid-cols-[10rem_1fr]">
          <Thumb slug={slug} assetId={img.assetId} alt={img.alt || "Imagem"} />
          <div className="space-y-2">
            <TextField label="Legenda" value={img.caption} onChange={(v) => onChange(replaceAt(images, i, { caption: v }))} />
            <TextField
              label="Texto alternativo (acessibilidade)"
              value={img.alt}
              onChange={(v) => onChange(replaceAt(images, i, { alt: v }))}
            />
            <TextField label="Crédito" value={img.credit} onChange={(v) => onChange(replaceAt(images, i, { credit: v }))} />
            <RowControls
              index={i}
              count={images.length}
              onMove={(d) => onChange(move(images, i, d))}
              onRemove={() => onChange(images.filter((_, k) => k !== i))}
            />
          </div>
        </div>
      ))}
      {images.length < CASE_FORM_LIMITS.imagesPerList ? (
        <ImageUpload
          slug={slug}
          label="+ Adicionar imagem"
          onUploaded={(assetId) => onChange([...images, { assetId, alt: "", caption: "" }])}
        />
      ) : null}
    </div>
  );
}

type Props = {
  slug: string;
  document: DossierDocument;
  form: DossierCaseForm;
  versions: DocumentVersionSummary[];
  onDocumentChange: (doc: DossierDocument) => void;
  onSave: DocumentSaveHandler;
  saving: boolean;
};

export function DossierCaseFormEditor({ slug, document, form, versions, onDocumentChange, onSave, saving }: Props) {
  function update(mutator: (f: DossierCaseForm) => DossierCaseForm) {
    onDocumentChange({ ...document, caseForm: mutator(form) });
  }

  const setPeople = (people: CasePerson[]) => update((f) => ({ ...f, victims: { ...f.victims, people } }));
  const setReusPeople = (people: CasePerson[]) => update((f) => ({ ...f, reus: { ...f.reus, people } }));
  const setPhases = (phases: CasePhase[]) => update((f) => ({ ...f, phases }));
  const setEntries = (entries: TimelineEntry[]) => update((f) => ({ ...f, timeline: { ...f.timeline, entries } }));
  const { cover, summary, victims, reus, phases, timeline, map, theories } = form;

  return (
    <div className="space-y-4">
      <p className="text-xs text-cm-gray">
        Preencha cada bloco; o leitor público é gerado automaticamente a partir destes campos (sem PDF). Use
        “Ver prévia” depois de salvar o rascunho — abra no celular para conferir o layout mobile.
      </p>

      <Panel title="1. Capa" description="Título, subtítulo e texto de abertura" defaultOpen>
        <TextField label="Título do dossiê" value={cover.title} onChange={(v) => update((f) => ({ ...f, cover: { ...f.cover, title: v } }))} />
        <TextField
          label="Subtítulo"
          value={cover.subtitle}
          onChange={(v) => update((f) => ({ ...f, cover: { ...f.cover, subtitle: v } }))}
        />
        <AreaField
          label="Texto de abertura"
          hint="Separe parágrafos com uma linha em branco."
          value={cover.lede}
          onChange={(v) => update((f) => ({ ...f, cover: { ...f.cover, lede: v } }))}
        />
      </Panel>

      <Panel title="2. Resumo do caso" description="Ficha (vítimas, local, data…) e destaque">
        <TextField
          label="Título da ficha"
          value={summary.title}
          onChange={(v) => update((f) => ({ ...f, summary: { ...f.summary, title: v } }))}
        />
        {summary.facts.map((fact, i) => (
          <div key={i} className="grid gap-2 rounded border border-cm-divider/80 p-3 md:grid-cols-[12rem_1fr]">
            <TextField
              label="Rótulo"
              value={fact.label}
              onChange={(v) =>
                update((f) => ({ ...f, summary: { ...f.summary, facts: replaceAt(f.summary.facts, i, { label: v }) } }))
              }
            />
            <TextField
              label="Valor"
              value={fact.value}
              onChange={(v) =>
                update((f) => ({ ...f, summary: { ...f.summary, facts: replaceAt(f.summary.facts, i, { value: v }) } }))
              }
            />
            <div className="md:col-span-2">
              <RowControls
                index={i}
                count={summary.facts.length}
                onMove={(d) => update((f) => ({ ...f, summary: { ...f.summary, facts: move(f.summary.facts, i, d) } }))}
                onRemove={() =>
                  update((f) => ({ ...f, summary: { ...f.summary, facts: f.summary.facts.filter((_, k) => k !== i) } }))
                }
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={summary.facts.length >= CASE_FORM_LIMITS.facts}
          onClick={() =>
            update((f) => ({ ...f, summary: { ...f.summary, facts: [...f.summary.facts, { label: "", value: "" }] } }))
          }
        >
          + Adicionar item
        </Button>
        <TextField
          label="Título do destaque (opcional)"
          value={summary.highlightTitle}
          onChange={(v) => update((f) => ({ ...f, summary: { ...f.summary, highlightTitle: v } }))}
        />
        <AreaField
          label="Texto do destaque (opcional)"
          rows={3}
          value={summary.highlightText}
          onChange={(v) => update((f) => ({ ...f, summary: { ...f.summary, highlightText: v } }))}
        />
      </Panel>

      <Panel title="3. Vítimas" description="Fotos e nomes (cards no leitor)">
        <TextField
          label="Título da seção"
          value={victims.title}
          onChange={(v) => update((f) => ({ ...f, victims: { ...f.victims, title: v } }))}
        />
        {victims.people.map((p, i) => (
          <div key={i} className="grid gap-3 rounded border border-cm-divider/80 p-3 md:grid-cols-[10rem_1fr]">
            <div className="space-y-2">
              {p.assetId ? <Thumb slug={slug} assetId={p.assetId} alt={p.name || "Foto"} /> : null}
              <ImageUpload
                slug={slug}
                label={p.assetId ? "Trocar foto" : "Enviar foto"}
                onUploaded={(assetId) => setPeople(replaceAt(victims.people, i, { assetId }))}
              />
            </div>
            <div className="space-y-2">
              <TextField label="Nome" value={p.name} onChange={(v) => setPeople(replaceAt(victims.people, i, { name: v }))} />
              <TextField
                label="Descrição curta (idade, relação…)"
                value={p.role}
                onChange={(v) => setPeople(replaceAt(victims.people, i, { role: v }))}
              />
              <TextField label="Crédito da foto" value={p.credit} onChange={(v) => setPeople(replaceAt(victims.people, i, { credit: v }))} />
              <div className="flex flex-wrap gap-2">
                {p.assetId ? (
                  <button
                    type="button"
                    className="min-h-11 rounded border border-cm-divider px-3 text-sm"
                    onClick={() => setPeople(replaceAt(victims.people, i, { assetId: undefined }))}
                  >
                    Remover foto
                  </button>
                ) : null}
                <RowControls
                  index={i}
                  count={victims.people.length}
                  onMove={(d) => setPeople(move(victims.people, i, d))}
                  onRemove={() => setPeople(victims.people.filter((_, k) => k !== i))}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={victims.people.length >= CASE_FORM_LIMITS.people}
          onClick={() => setPeople([...victims.people, { name: "" }])}
        >
          + Adicionar pessoa
        </Button>
        <p className="text-xs text-cm-gray">Uma única foto aparece em largura total; várias viram uma grade de cards.</p>
      </Panel>

      <Panel title="4. Réus / acusados" description="Separado das vítimas — nomes, fotos e créditos">
        <TextField
          label="Título da seção"
          value={reus.title}
          onChange={(v) => update((f) => ({ ...f, reus: { ...f.reus, title: v } }))}
        />
        {reus.people.map((p, i) => (
          <div key={i} className="grid gap-3 rounded border border-cm-divider/80 p-3 md:grid-cols-[10rem_1fr]">
            <div className="space-y-2">
              {p.assetId ? <Thumb slug={slug} assetId={p.assetId} alt={p.name || "Foto"} /> : null}
              <ImageUpload
                slug={slug}
                label={p.assetId ? "Trocar foto" : "Enviar foto"}
                onUploaded={(assetId) => setReusPeople(replaceAt(reus.people, i, { assetId }))}
              />
            </div>
            <div className="space-y-2">
              <TextField label="Nome" value={p.name} onChange={(v) => setReusPeople(replaceAt(reus.people, i, { name: v }))} />
              <TextField
                label="Observação (opcional)"
                value={p.role}
                onChange={(v) => setReusPeople(replaceAt(reus.people, i, { role: v }))}
              />
              <TextField label="Crédito da foto" value={p.credit} onChange={(v) => setReusPeople(replaceAt(reus.people, i, { credit: v }))} />
              <div className="flex flex-wrap gap-2">
                {p.assetId ? (
                  <button
                    type="button"
                    className="min-h-11 rounded border border-cm-divider px-3 text-sm"
                    onClick={() => setReusPeople(replaceAt(reus.people, i, { assetId: undefined }))}
                  >
                    Remover foto
                  </button>
                ) : null}
                <RowControls
                  index={i}
                  count={reus.people.length}
                  onMove={(d) => setReusPeople(move(reus.people, i, d))}
                  onRemove={() => setReusPeople(reus.people.filter((_, k) => k !== i))}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={reus.people.length >= CASE_FORM_LIMITS.people}
          onClick={() => setReusPeople([...reus.people, { name: "" }])}
        >
          + Adicionar pessoa
        </Button>
      </Panel>

      <Panel title={`5. Fases do dossiê (${phases.length})`} description="Etapas do caso, em ordem: texto + imagens" defaultOpen>
        {phases.map((phase, i) => (
          <div key={phase.id} className="space-y-3 rounded border border-cm-divider/80 p-3">
            <div className="grid gap-2 md:grid-cols-[10rem_1fr]">
              <TextField
                label="Rótulo"
                placeholder={`Fase ${i + 1}`}
                value={phase.label}
                onChange={(v) => setPhases(replaceAt(phases, i, { label: v }))}
              />
              <TextField label="Título da fase" value={phase.title} onChange={(v) => setPhases(replaceAt(phases, i, { title: v }))} />
            </div>
            <AreaField
              label="Texto"
              hint="Separe parágrafos com uma linha em branco."
              rows={6}
              value={phase.body}
              onChange={(v) => setPhases(replaceAt(phases, i, { body: v }))}
            />
            <ImageListEditor slug={slug} images={phase.images} onChange={(images) => setPhases(replaceAt(phases, i, { images }))} />
            <RowControls
              index={i}
              count={phases.length}
              onMove={(d) => setPhases(move(phases, i, d))}
              onRemove={() => {
                if (confirm(`Remover a fase “${phase.title || i + 1}”?`)) setPhases(phases.filter((_, k) => k !== i));
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={phases.length >= CASE_FORM_LIMITS.phases}
          onClick={() => setPhases([...phases, { id: newCaseId("p"), title: "", body: "", images: [] }])}
        >
          + Adicionar fase
        </Button>
      </Panel>

      <Panel
        title={`6. Linha do tempo (${timeline.entries.length})`}
        description="Vertical no celular; espinha central com cards alternados no desktop"
      >
        <TextField
          label="Título da linha do tempo"
          value={timeline.title}
          onChange={(v) => update((f) => ({ ...f, timeline: { ...f.timeline, title: v } }))}
        />
        {timeline.entries.map((entry, i) => (
          <div key={i} className="space-y-2 rounded border border-cm-divider/80 p-3">
            <div className="grid gap-2 md:grid-cols-[12rem_1fr]">
              <TextField
                label="Data"
                placeholder="Fev. 2023"
                value={entry.date}
                onChange={(v) => setEntries(replaceAt(timeline.entries, i, { date: v }))}
              />
              <TextField label="Título" value={entry.title} onChange={(v) => setEntries(replaceAt(timeline.entries, i, { title: v }))} />
            </div>
            <AreaField
              label="Descrição"
              rows={3}
              value={entry.body}
              onChange={(v) => setEntries(replaceAt(timeline.entries, i, { body: v }))}
            />
            <div className="flex flex-wrap items-center gap-3">
              {entry.assetId ? <Thumb slug={slug} assetId={entry.assetId} alt={entry.title || "Imagem"} /> : null}
              <ImageUpload
                slug={slug}
                label={entry.assetId ? "Trocar imagem" : "Imagem (opcional)"}
                onUploaded={(assetId) => setEntries(replaceAt(timeline.entries, i, { assetId }))}
              />
              {entry.assetId ? (
                <button
                  type="button"
                  className="min-h-11 rounded border border-cm-divider px-3 text-sm"
                  onClick={() => setEntries(replaceAt(timeline.entries, i, { assetId: undefined }))}
                >
                  Remover imagem
                </button>
              ) : null}
            </div>
            <RowControls
              index={i}
              count={timeline.entries.length}
              onMove={(d) => setEntries(move(timeline.entries, i, d))}
              onRemove={() => setEntries(timeline.entries.filter((_, k) => k !== i))}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={timeline.entries.length >= CASE_FORM_LIMITS.timelineEntries}
          onClick={() => setEntries([...timeline.entries, { date: "", title: "", body: "" }])}
        >
          + Adicionar evento
        </Button>
      </Panel>

      <Panel title={`7. Mapa e imagens (${map.images.length})`} description="Mapas, locais, documentos visuais">
        <TextField
          label="Título da seção"
          value={map.title}
          onChange={(v) => update((f) => ({ ...f, map: { ...f.map, title: v } }))}
        />
        <ImageListEditor
          slug={slug}
          images={map.images}
          onChange={(images) => update((f) => ({ ...f, map: { ...f.map, images } }))}
        />
      </Panel>

      <Panel title="8. Teorias e análise editorial">
        <TextField
          label="Título da seção"
          value={theories.title}
          onChange={(v) => update((f) => ({ ...f, theories: { ...f.theories, title: v } }))}
        />
        <AreaField
          label="Texto"
          hint="Separe parágrafos com uma linha em branco."
          value={theories.text}
          onChange={(v) => update((f) => ({ ...f, theories: { ...f.theories, text: v } }))}
        />
        <AreaField
          label="Citação de destaque (opcional)"
          rows={2}
          value={theories.quote}
          onChange={(v) => update((f) => ({ ...f, theories: { ...f.theories, quote: v } }))}
        />
        <TextField
          label="Autoria da citação"
          value={theories.quoteAttribution}
          onChange={(v) => update((f) => ({ ...f, theories: { ...f.theories, quoteAttribution: v } }))}
        />
      </Panel>

      {form.extraSections.length > 0 ? (
        <p className="rounded border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-100/90">
          {form.extraSections.length} seção(ões) de conteúdo antigo não cabem nos campos acima e são mantidas ao final do
          dossiê sem edição. Para editá-las, desative o formulário (opção abaixo).
        </p>
      ) : null}

      <DossierDocumentActions slug={slug} versions={versions} onSave={onSave} saving={saving} />
    </div>
  );
}
