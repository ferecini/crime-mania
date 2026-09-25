/**
 * Valida oEmbed dos IDs Spotify do catálogo (concorrência limitada).
 * Falhas são registradas; exit 0 para não quebrar build por indisponibilidade transitória.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OEMBED = "https://open.spotify.com/oembed";
const CONCURRENCY = 5;

const episodes = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/episodes.generated.json"), "utf8"),
);

const ids = episodes.map((e) => e.spotifyOpenEpisodeId);
const dupSpotify = ids.filter((id, i) => ids.indexOf(id) !== i);
const appleIds = episodes.map((e) => e.appleEpisodeId);
const dupApple = appleIds.filter((id, i) => appleIds.indexOf(id) !== i);

if (dupSpotify.length) console.warn("Duplicados Spotify:", [...new Set(dupSpotify)]);
if (dupApple.length) console.warn("Duplicados Apple:", [...new Set(dupApple)]);

async function checkId(id) {
  if (!/^[a-zA-Z0-9]{22}$/.test(id)) return { id, ok: false, reason: "formato" };
  const target = `https://open.spotify.com/episode/${id}`;
  try {
    const res = await fetch(`${OEMBED}?url=${encodeURIComponent(target)}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { id, ok: false, reason: `http ${res.status}` };
    const data = await res.json();
    const ok = Boolean(data.html?.includes("open.spotify.com/embed"));
    return { id, ok, reason: ok ? "ok" : "sem embed" };
  } catch (err) {
    return { id, ok: false, reason: err instanceof Error ? err.message : "erro" };
  }
}

async function runPool(items, worker) {
  const results = [];
  let index = 0;
  async function next() {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => next()));
  return results;
}

const results = await runPool(ids, checkId);
const failed = results.filter((r) => !r.ok);
console.log(`Spotify oEmbed: ${results.length - failed.length}/${results.length} OK`);
if (failed.length) {
  console.warn(
    "Falhas oEmbed (primeiras 20):",
    failed.slice(0, 20).map((f) => `${f.id} (${f.reason})`),
  );
}
