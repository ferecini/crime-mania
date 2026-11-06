/**
 * Banfield: grade 2×2 no asset `fig-vitimas` (legado). O leitor envia `?q=0..3` para recortar no servidor.
 * Mantido separado de `banfield-portrait-assets` (sharp) para poder importar em componentes client.
 */

const VITIMAS_QUADRANT_BY_NAME: Record<string, 0 | 1 | 2 | 3> = {
  "christine banfield": 0,
  "joseph ryan": 1,
  "brendan banfield": 2,
  "juliana magalhaes": 3,
};

function normalizePersonNameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Quadrante da grade para cada nome (só quando `assetId === "fig-vitimas"`). */
export function banfieldVitimasQuadrantFromPersonName(name: string): 0 | 1 | 2 | 3 | null {
  return VITIMAS_QUADRANT_BY_NAME[normalizePersonNameKey(name)] ?? null;
}

/** Parse `q` da query string (0–3). */
export function parseVitimasQuadrantQuery(raw: string | null): 0 | 1 | 2 | 3 | null {
  if (raw === null || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (n === 0 || n === 1 || n === 2 || n === 3) return n;
  return null;
}
