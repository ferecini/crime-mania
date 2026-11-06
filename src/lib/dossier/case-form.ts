/**
 * Modelo estruturado do dossiê (formulário editorial).
 *
 * `DossierCaseForm` é a fonte da verdade quando existe em `DossierDocument.caseForm`;
 * `compileCaseForm` gera as `sections` que o leitor público já sabe renderizar, e
 * `importCaseForm` converte documentos antigos (HTML-only / extraídos de PDF) para o formulário.
 */
import type {
  DocumentBlock,
  DossierDocument,
  DossierDocumentSection,
  TimelineEntry,
} from "@/lib/dossier/document-types";

export type CaseImage = {
  assetId: string;
  alt: string;
  caption?: string;
  credit?: string;
};

export type CasePerson = {
  name: string;
  role?: string;
  credit?: string;
  assetId?: string;
};

export type CasePhase = {
  /** Estável; compõe o id da seção (`fase-<id>`) e a âncora do índice. */
  id: string;
  title: string;
  /** Ex.: "Fase 1". Vazio = numeração automática. */
  label?: string;
  /** Parágrafos separados por linha em branco. */
  body: string;
  images: CaseImage[];
};

export type DossierCaseForm = {
  cover: { title: string; subtitle?: string; lede: string };
  summary: {
    title?: string;
    facts: { label: string; value: string }[];
    highlightTitle?: string;
    highlightText?: string;
  };
  victims: { title?: string; people: CasePerson[] };
  phases: CasePhase[];
  timeline: { title?: string; entries: TimelineEntry[] };
  map: { title?: string; images: CaseImage[] };
  theories: { title?: string; text?: string; quote?: string; quoteAttribution?: string };
  /** Seções de documentos antigos que não cabem no formulário (preservadas). */
  extraSections: DossierDocumentSection[];
};

export const CASE_FORM_LIMITS = {
  people: 24,
  phases: 24,
  imagesPerList: 12,
  facts: 24,
  timelineEntries: 48,
} as const;

export function newCaseId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function emptyCaseForm(title = ""): DossierCaseForm {
  return {
    cover: { title, subtitle: "", lede: "" },
    summary: {
      title: "Vítimas e local",
      facts: [
        { label: "Vítimas", value: "" },
        { label: "Local", value: "" },
        { label: "Data", value: "" },
      ],
      highlightTitle: "",
      highlightText: "",
    },
    victims: { title: "Vítimas", people: [] },
    phases: [],
    timeline: { title: "Cronologia editorial", entries: [] },
    map: { title: "Mapa", images: [] },
    theories: { title: "Teorias — Crime Mania", text: "", quote: "", quoteAttribution: "" },
    extraSections: [],
  };
}

/* ------------------------------------------------------------------ */
/* Normalização (servidor): aceita JSON arbitrário e devolve formulário válido */
/* ------------------------------------------------------------------ */

function str(v: unknown, max: number): string {
  return (typeof v === "string" ? v : "").trim().slice(0, max);
}

function optStr(v: unknown, max: number): string | undefined {
  return str(v, max) || undefined;
}

function assetId(v: unknown): string {
  return str(v, 64).replace(/[^a-zA-Z0-9_-]/g, "");
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function list<T>(v: unknown, max: number, map: (item: Record<string, unknown>, i: number) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (let i = 0; i < v.length && out.length < max; i++) {
    const item = map(rec(v[i]), i);
    if (item) out.push(item);
  }
  return out;
}

function normImages(v: unknown): CaseImage[] {
  return list(v, CASE_FORM_LIMITS.imagesPerList, (i) => {
    const id = assetId(i.assetId);
    if (!id) return null;
    return {
      assetId: id,
      alt: str(i.alt, 500),
      caption: optStr(i.caption, 1000),
      credit: optStr(i.credit, 300),
    };
  });
}

export function normalizeCaseForm(raw: unknown): DossierCaseForm {
  const r = rec(raw);
  const cover = rec(r.cover);
  const summary = rec(r.summary);
  const victims = rec(r.victims);
  const timeline = rec(r.timeline);
  const map = rec(r.map);
  const theories = rec(r.theories);
  const usedPhaseIds = new Set<string>();

  return {
    cover: {
      title: str(cover.title, 300),
      subtitle: optStr(cover.subtitle, 500),
      lede: str(cover.lede, 20_000),
    },
    summary: {
      title: optStr(summary.title, 200),
      facts: list(summary.facts, CASE_FORM_LIMITS.facts, (f) => {
        const label = str(f.label, 120);
        const value = str(f.value, 2000);
        return label || value ? { label, value } : null;
      }),
      highlightTitle: optStr(summary.highlightTitle, 200),
      highlightText: optStr(summary.highlightText, 4000),
    },
    victims: {
      title: optStr(victims.title, 200),
      people: list(victims.people, CASE_FORM_LIMITS.people, (p) => {
        const name = str(p.name, 200);
        const id = assetId(p.assetId);
        if (!name && !id) return null;
        return {
          name,
          role: optStr(p.role, 300),
          credit: optStr(p.credit, 300),
          assetId: id || undefined,
        };
      }),
    },
    phases: list(r.phases, CASE_FORM_LIMITS.phases, (p, i) => {
      const title = str(p.title, 200);
      const body = str(p.body, 20_000);
      const images = normImages(p.images);
      if (!title && !body && images.length === 0) return null;
      let id = str(p.id, 40).replace(/[^a-zA-Z0-9_-]/g, "") || `p${i + 1}`;
      while (usedPhaseIds.has(id)) id = `${id}x`;
      usedPhaseIds.add(id);
      return { id, title, label: optStr(p.label, 40), body, images };
    }),
    timeline: {
      title: optStr(timeline.title, 200),
      entries: list(timeline.entries, CASE_FORM_LIMITS.timelineEntries, (e) => {
        const entry: TimelineEntry = {
          date: str(e.date, 80),
          title: str(e.title, 200),
          body: str(e.body, 4000),
        };
        const id = assetId(e.assetId);
        if (id) entry.assetId = id;
        return entry.date || entry.title || entry.body ? entry : null;
      }),
    },
    map: { title: optStr(map.title, 200), images: normImages(map.images) },
    theories: {
      title: optStr(theories.title, 200),
      text: optStr(theories.text, 20_000),
      quote: optStr(theories.quote, 2000),
      quoteAttribution: optStr(theories.quoteAttribution, 300),
    },
    extraSections: Array.isArray(r.extraSections)
      ? (r.extraSections as DossierDocumentSection[]).slice(0, 12)
      : [],
  };
}

/* ------------------------------------------------------------------ */
/* Formulário -> sections                                              */
/* ------------------------------------------------------------------ */

function paragraphs(text?: string): string[] {
  return (text ?? "")
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function figureBlocks(prefix: string, images: CaseImage[]): DocumentBlock[] {
  return images
    .filter((img) => img.assetId)
    .map((img, i) => ({
      id: `${prefix}-img-${i + 1}`,
      type: "figure" as const,
      order: 0,
      assetId: img.assetId,
      alt: img.alt || img.caption || "",
      caption: img.caption ?? "",
      credit: img.credit,
    }));
}

function paragraphBlocks(prefix: string, text?: string): DocumentBlock[] {
  return paragraphs(text).map((t, i) => ({
    id: `${prefix}-p-${i + 1}`,
    type: "paragraph" as const,
    order: 0,
    text: t,
  }));
}

function heading(id: string, level: 1 | 2 | 3, text?: string): DocumentBlock[] {
  return text?.trim() ? [{ id, type: "heading", order: 0, level, text }] : [];
}

function section(
  id: string,
  title: string | undefined,
  blocks: DocumentBlock[],
  extra?: Partial<DossierDocumentSection>,
): DossierDocumentSection[] {
  if (blocks.length === 0) return [];
  return [
    {
      id,
      order: 0,
      title,
      ...extra,
      blocks: blocks.map((b, i) => ({ ...b, order: i + 1 })),
    },
  ];
}

export function compileCaseForm(form: DossierCaseForm): DossierDocumentSection[] {
  const { cover, summary, victims, timeline, map, theories } = form;
  const sections: DossierDocumentSection[] = [];

  sections.push(
    ...section("intro", "Capa", [
      ...heading("cover-title", 1, cover.title),
      ...heading("cover-subtitle", 2, cover.subtitle),
      ...paragraphBlocks("cover-lede", cover.lede),
    ]),
  );

  const facts = summary.facts.filter((f) => f.label || f.value);
  sections.push(
    ...section("facts", "Resumo do caso", [
      ...(facts.length
        ? [{ id: "facts-main", type: "facts" as const, order: 0, title: summary.title, items: facts }]
        : []),
      ...(summary.highlightText?.trim()
        ? [
            {
              id: "facts-highlight",
              type: "callout" as const,
              order: 0,
              variant: "accent" as const,
              title: summary.highlightTitle,
              text: summary.highlightText,
            },
          ]
        : []),
    ]),
  );

  sections.push(
    ...section("vitimas", victims.title || "Vítimas", [
      ...(victims.people.length
        ? [
            {
              id: "people-main",
              type: "people" as const,
              order: 0,
              title: victims.title,
              items: victims.people,
            },
          ]
        : []),
    ]),
  );

  form.phases.forEach((phase, i) => {
    sections.push(
      ...section(
        `fase-${phase.id}`,
        phase.title,
        [...paragraphBlocks(`fase-${phase.id}`, phase.body), ...figureBlocks(`fase-${phase.id}`, phase.images)],
        { kind: "phase", label: phase.label?.trim() || `Fase ${i + 1}` },
      ),
    );
  });

  sections.push(
    ...section("timeline", "Linha do tempo", [
      ...(timeline.entries.length
        ? [
            {
              id: "timeline-main",
              type: "timeline" as const,
              order: 0,
              title: timeline.title,
              entries: timeline.entries,
            },
          ]
        : []),
    ]),
  );

  sections.push(
    ...section("mapa", "Mapa", [...heading("map-title", 2, map.title), ...figureBlocks("map", map.images)]),
  );

  sections.push(
    ...section("teorias", "Teorias do dossiê", [
      ...heading("theories-title", 2, theories.title),
      ...paragraphBlocks("theories", theories.text),
      ...(theories.quote?.trim()
        ? [
            {
              id: "theories-quote",
              type: "quote" as const,
              order: 0,
              text: theories.quote,
              attribution: theories.quoteAttribution,
            },
          ]
        : []),
    ]),
  );

  return [...sections, ...form.extraSections];
}

/* ------------------------------------------------------------------ */
/* Documento antigo -> formulário                                      */
/* ------------------------------------------------------------------ */

const PHASE_COMPATIBLE: ReadonlySet<DocumentBlock["type"]> = new Set([
  "heading",
  "paragraph",
  "image",
  "figure",
]);

function toCaseImage(b: DocumentBlock): CaseImage | null {
  if (b.type !== "image" && b.type !== "figure") return null;
  return { assetId: b.assetId, alt: b.alt, caption: b.caption, credit: b.credit };
}

/** Nomes separados a partir de legenda tipo "A, B, C e D" (foto conjunta no PDF legado). */
export function splitVictimNamesFromCaption(caption: string): string[] {
  const cleaned = caption.replace(/\.$/, "").trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/,\s*|\s+e\s+/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [cleaned];
}

function blocksToPhases(sec: DossierDocumentSection, blocks: DocumentBlock[], nextId: () => string): CasePhase[] {
  const phases: CasePhase[] = [];
  let cur: CasePhase | null = null;
  const ensure = () => {
    if (!cur) {
      cur = { id: nextId(), title: sec.title ?? "", body: "", images: [] };
      phases.push(cur);
    }
    return cur;
  };
  for (const b of blocks) {
    if (b.type === "heading") {
      cur = { id: nextId(), title: b.text, body: "", images: [] };
      phases.push(cur);
    } else if (b.type === "paragraph") {
      const p = ensure();
      p.body = p.body ? `${p.body}\n\n${b.text}` : b.text;
    } else {
      const img = toCaseImage(b);
      if (img) ensure().images.push(img);
    }
  }
  return phases;
}

export function importCaseForm(doc: DossierDocument): DossierCaseForm {
  if (doc.caseForm) return normalizeCaseForm(doc.caseForm);

  const form = emptyCaseForm(doc.title);
  form.summary.facts = [];
  form.victims.title = undefined;
  form.map.title = undefined;
  form.theories.title = undefined;
  form.timeline.title = undefined;
  form.summary.title = undefined;

  const seen = new Set<string>();
  let phaseSeq = 0;
  const nextPhaseId = () => `p${++phaseSeq}`;
  const sections = doc.sections.slice().sort((a, b) => a.order - b.order);

  for (const sec of sections) {
    const blocks = sec.blocks.slice().sort((a, b) => a.order - b.order);
    const used = new Set<string>();
    const first = <T extends DocumentBlock["type"]>(type: T) => {
      const b = blocks.find((x) => x.type === type && !used.has(x.id));
      if (b) used.add(b.id);
      return b as Extract<DocumentBlock, { type: T }> | undefined;
    };
    const all = (pred: (b: DocumentBlock) => boolean) => {
      const out = blocks.filter((b) => !used.has(b.id) && pred(b));
      out.forEach((b) => used.add(b.id));
      return out;
    };

    const known = ["intro", "facts", "vitimas", "timeline", "mapa", "teorias"].includes(sec.id) && !seen.has(sec.id);
    if (known) seen.add(sec.id);

    if (known && sec.id === "intro") {
      const h1 = blocks.find((b) => b.type === "heading" && b.level === 1);
      if (h1 && h1.type === "heading") {
        form.cover.title = h1.text;
        used.add(h1.id);
      }
      const h2 = blocks.find((b) => b.type === "heading" && !used.has(b.id));
      if (h2 && h2.type === "heading") {
        form.cover.subtitle = h2.text;
        used.add(h2.id);
      }
      form.cover.lede = all((b) => b.type === "paragraph")
        .map((b) => (b.type === "paragraph" ? b.text : ""))
        .join("\n\n");
    } else if (known && sec.id === "facts") {
      const facts = first("facts");
      if (facts) {
        form.summary.title = facts.title;
        form.summary.facts = facts.items;
      }
      const callout = first("callout");
      if (callout) {
        form.summary.highlightTitle = callout.title;
        form.summary.highlightText = callout.text;
      }
    } else if (known && sec.id === "vitimas") {
      const h = first("heading");
      form.victims.title = h?.text;
      const people = first("people");
      if (people) {
        form.victims.people = people.items;
      } else {
        const figures = all((b) => b.type === "image" || b.type === "figure");
        form.victims.people = figures.flatMap((b) => {
          const img = toCaseImage(b);
          if (!img) return [];
          const cap = (img.caption || img.alt || "").trim();
          const names = splitVictimNamesFromCaption(cap);
          if (names.length <= 1) {
            return [{ name: names[0] ?? "Vítimas", credit: img.credit, assetId: img.assetId }];
          }
          // Fotografia única com legenda multi-pessoa: um card por nome (mesmo assetId até trocar no admin).
          return names.map((name) => ({
            name,
            credit: img.credit,
            assetId: img.assetId,
          }));
        });
      }
    } else if (known && sec.id === "timeline") {
      const tl = first("timeline");
      if (tl) {
        form.timeline.title = tl.title;
        form.timeline.entries = tl.entries;
      }
    } else if (known && sec.id === "mapa") {
      const h = first("heading");
      form.map.title = h?.text;
      form.map.images = all((b) => b.type === "image" || b.type === "figure").flatMap((b) => {
        const img = toCaseImage(b);
        return img ? [img] : [];
      });
    } else if (known && sec.id === "teorias") {
      const h = first("heading");
      form.theories.title = h?.text;
      form.theories.text = all((b) => b.type === "paragraph")
        .map((b) => (b.type === "paragraph" ? b.text : ""))
        .join("\n\n");
      const q = first("quote");
      if (q) {
        form.theories.quote = q.text;
        form.theories.quoteAttribution = q.attribution;
      }
    } else if (blocks.every((b) => PHASE_COMPATIBLE.has(b.type))) {
      form.phases.push(...blocksToPhases(sec, blocks, nextPhaseId));
      continue;
    } else {
      form.extraSections.push(sec);
      continue;
    }

    const leftover = blocks.filter((b) => !used.has(b.id));
    if (leftover.length) {
      form.extraSections.push({ ...sec, id: `${sec.id}-extra`, blocks: leftover });
    }
  }

  return form;
}
