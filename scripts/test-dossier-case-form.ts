import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { compileCaseForm, emptyCaseForm, importCaseForm, normalizeCaseForm } from "../src/lib/dossier/case-form";
import { sanitizeDocument } from "../src/lib/dossier/document-sanitize";
import type { DossierDocument } from "../src/lib/dossier/document-types";

const banfield = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "scripts", "data", "familia-banfield-document.json"), "utf8"),
) as DossierDocument;

// 1. Documento HTML antigo (Banfield) -> formulário
const form = importCaseForm(banfield);
assert.equal(form.cover.title, "Assassinato: Família Banfield");
assert.ok(form.cover.lede.includes("Brendan"));
assert.equal(form.summary.facts.length, 3);
assert.equal(form.victims.people.length, 2);
assert.equal(form.reus.people.length, 2);
assert.deepEqual(
  form.victims.people.map((p) => p.assetId),
  ["fig-portrait-christine", "fig-portrait-joseph"],
);
assert.deepEqual(
  form.reus.people.map((p) => p.assetId),
  ["fig-portrait-brendan", "fig-portrait-juliana"],
);
assert.equal(form.victims.people[0]!.name, "Christine Banfield");
assert.equal(form.phases.length, 3, "versoes -> 3 fases (acusação, defesa Brendan, defesa Juliana)");
assert.equal(form.timeline.entries.length, 6);
assert.equal(form.map.images.length, 2);
assert.ok(form.theories.quote?.includes("invasão"));
assert.equal(form.extraSections.length, 0);

// 2. Formulário -> sections (ids estáveis para o leitor: mapa, timeline)
const sections = compileCaseForm(form);
const ids = sections.map((s) => s.id);
assert.deepEqual(ids.slice(0, 4), ["intro", "facts", "vitimas", "reus"]);
assert.ok(ids.includes("mapa") && ids.includes("timeline") && ids.includes("teorias"));
const phaseSections = sections.filter((s) => s.kind === "phase");
assert.equal(phaseSections.length, 3);
assert.equal(phaseSections[0]!.label, "Fase 1");
assert.equal(phaseSections[0]!.title, "Versão da acusação");

// 3. sanitizeDocument regenera sections a partir do formulário e normaliza entrada suja
const dirty = {
  ...banfield,
  sections: [],
  caseForm: {
    ...form,
    cover: { ...form.cover, title: `  ${"x".repeat(400)}  ` },
    victims: { people: [{ name: "Ana", assetId: "../../etc/passwd" }, { name: "", assetId: "" }] },
    timeline: { entries: [{ date: "", title: "", body: "" }, { date: "2020", title: "A", body: "B", assetId: "a b" }] },
  },
} as unknown as DossierDocument;
const clean = sanitizeDocument(dirty);
assert.ok(clean.sections.length > 0, "sections vêm do caseForm");
assert.equal(clean.caseForm!.cover.title.length, 300);
assert.equal(clean.caseForm!.victims.people.length, 1);
assert.equal(clean.caseForm!.victims.people[0]!.assetId, "etcpasswd");
assert.equal(clean.caseForm!.timeline.entries.length, 1);
assert.equal(clean.caseForm!.timeline.entries[0]!.assetId, "ab");

// 4. Idempotência: reimportar um doc com caseForm devolve o mesmo formulário
assert.deepEqual(importCaseForm(clean), clean.caseForm);

// 5. Seção desconhecida com blocos não compatíveis é preservada (extraSections)
// Sem `caseForm`: importCaseForm lê só `sections` (com caseForm preenchido ele normaliza só o JSON do formulário).
const { caseForm: _ignoreCaseForm, ...banfieldSectionsOnly } = banfield;
const withTable: DossierDocument = {
  ...banfieldSectionsOnly,
  sections: [
    ...banfield.sections,
    {
      id: "extra-tabela",
      order: 99,
      title: "Tabela",
      blocks: [{ id: "t1", type: "table", order: 1, headers: ["A"], rows: [["1"]] }],
    },
  ],
};
assert.equal(importCaseForm(withTable).extraSections.length, 1);
assert.ok(compileCaseForm(importCaseForm(withTable)).some((s) => s.id === "extra-tabela"));

// 6. Formulário vazio compila sem erros e normaliza lixo
assert.deepEqual(compileCaseForm(normalizeCaseForm(null)), []);
assert.ok(emptyCaseForm("T").cover.title === "T");

console.log("test-dossier-case-form: OK");
