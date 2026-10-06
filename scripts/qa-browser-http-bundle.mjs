/**
 * Executar no browser via: node scripts/run-qa-browser-http.mjs
 * (Playwright/CDP) — ou colar função qaGalleryHttp() no Preview logado.
 */
export function qaGalleryHttpScript() {
  return String(async function runQa() {
    const slug = "familia-banfield";
    const base = location.origin;
    const creds = globalThis.__QA_CREDS;
    if (!creds?.free || !creds?.tier1 || !creds?.tier2) {
      throw new Error("Set globalThis.__QA_CREDS before running QA");
    }
    const tests = [];
    const push = (name, pass, detail) => tests.push({ name, pass, detail });

    async function login({ email, password }) {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      return r.status;
    }

    async function gManifest(cred = "include") {
      const r = await fetch(`/api/dossier/${slug}/gallery/manifest`, { credentials: cred });
      const j = await r.json().catch(() => ({}));
      return { status: r.status, n: j.items?.length, j };
    }

    const anon = await fetch(`/api/dossier/${slug}/gallery/manifest`, { credentials: "omit" });
    push("anon gallery manifest 403", anon.status === 403, anon.status);

    push("free login", (await login(creds.free)) === 200, "free");
    const freeG = await gManifest();
    push("free gallery 403", freeG.status === 403, freeG.status);
    const firstId = freeG.j?.items?.[0]?.id;
    if (firstId) {
      const img = await fetch(`/api/dossier/${slug}/gallery/${firstId}`, { credentials: "include" });
      push("free image 403", img.status === 403, img.status);
    } else {
      const img = await fetch(`/api/dossier/${slug}/gallery/00000000-0000-4000-8000-000000000099`, {
        credentials: "include",
      });
      push("free image 403", img.status === 403 || img.status === 404, img.status);
    }

    push("tier1 login", (await login(creds.tier1)) === 200, "tier1");
    const t1 = await gManifest();
    push("tier1 gallery 200 x5", t1.status === 200 && t1.n === 5, `${t1.status} n=${t1.n}`);
    const meta = t1.j?.items?.[0];
    push(
      "tier1 metadata illustrative",
      meta?.isIllustrative === true && Boolean(meta?.caption) && Boolean(meta?.alt) && Boolean(meta?.credit),
      meta ? `${meta.isIllustrative} cap=${!!meta.caption}` : "no item",
    );

    push("tier2 login", (await login(creds.tier2)) === 200, "tier2");
    const t2 = await gManifest();
    push("tier2 gallery 200 x5", t2.status === 200 && t2.n === 5, `${t2.status} n=${t2.n}`);

    await login(creds.tier1);
    const html = await fetch(`/membro/dossies/${slug}`, { credentials: "include" }).then((r) => r.text());
    const leak = ["private.blob.vercel", "?key=", "BLOB_READ_WRITE"].filter((s) => html.includes(s));
    push("tier1 HTML leak-free", leak.length === 0, leak.join(",") || "ok");

    await login(creds.free);
    const nonAdmin = await fetch(`/api/admin/gallery/${slug}/manifest`, { credentials: "include" });
    push("non-admin GET admin gallery 403", nonAdmin.status === 403, nonAdmin.status);

    await login(creds.tier2);
    const adminGet = await fetch(`/api/admin/gallery/${slug}/manifest`, { credentials: "include" });
    const adminJ = await adminGet.json().catch(() => ({}));
    push("admin gallery GET 200", adminGet.status === 200, adminGet.status);

    const xorig = await fetch(`/api/admin/gallery/${slug}/manifest`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", Origin: "https://evil.test" },
      body: JSON.stringify({ items: adminJ.manifest?.items ?? [], action: "save_draft" }),
    });
    push("cross-origin PATCH 403", xorig.status === 403, xorig.status);

    const badPayload = await fetch(`/api/admin/gallery/${slug}/manifest`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "nope" }),
    });
    push("invalid payload 400", badPayload.status === 400, badPayload.status);

    const pngB64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const bin = Uint8Array.from(atob(pngB64), (c) => c.charCodeAt(0));
    const fd = new FormData();
    fd.set("files", new Blob([bin], { type: "image/png" }), "qa-temp-sixth.png");
    const up = await fetch(`/api/admin/gallery/${slug}/upload`, { method: "POST", credentials: "include", body: fd });
    const upJ = await up.json().catch(() => ({}));
    push("admin upload 6th 200", up.status === 200, up.status);
    let manifest = upJ.manifest ?? adminJ.manifest;
    const sixthId = upJ.added?.[0];
    if (sixthId && manifest?.items) {
      manifest.items = manifest.items.map((it) =>
        it.id === sixthId
          ? {
              ...it,
              caption: "QA temp sixth",
              alt: "QA alt sixth",
              credit: "QA credit",
              isIllustrative: true,
              sourceType: "ai_placeholder",
            }
          : it,
      );
      const sixth = manifest.items.find((it) => it.id === sixthId);
      const rest = manifest.items.filter((it) => it.id !== sixthId);
      manifest.items = [...rest, sixth].map((it, i) => ({ ...it, order: i + 1 }));
      manifest.coverImageId = sixthId;
      await fetch(`/api/admin/gallery/${slug}/manifest`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: manifest.items, coverImageId: manifest.coverImageId, action: "save_draft" }),
      });
      await fetch(`/api/admin/gallery/${slug}/manifest`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: manifest.items, coverImageId: manifest.coverImageId, action: "publish" }),
      });
      await login(creds.tier1);
      const pub6 = await gManifest();
      push("reader after 6th publish x6", pub6.status === 200 && pub6.n === 6, `${pub6.status} n=${pub6.n}`);
      await login(creds.tier2);
      await fetch(`/api/admin/gallery/${slug}/items/${sixthId}`, { method: "DELETE", credentials: "include" });
      const restored = manifest.items.filter((it) => it.id !== sixthId).map((it, i) => ({ ...it, order: i + 1 }));
      await fetch(`/api/admin/gallery/${slug}/manifest`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: restored,
          coverImageId: restored[0]?.id,
          action: "publish",
        }),
      });
      await login(creds.tier1);
      const pub5 = await gManifest();
      push("reader restored 5 items", pub5.status === 200 && pub5.n === 5, `${pub5.status} n=${pub5.n}`);
    }

    await login(creds.tier2);
    const adm = await fetch(`/api/admin/gallery/${slug}/manifest`, { credentials: "include" }).then((r) => r.json());
    await fetch(`/api/admin/gallery/${slug}/manifest`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: adm.manifest?.items ?? [], action: "unpublish" }),
    });
    await login(creds.tier1);
    const unpub = await gManifest();
    push("after unpublish member 503/403", unpub.status === 503 || unpub.status === 403, unpub.status);
    await login(creds.tier2);
    await fetch(`/api/admin/gallery/${slug}/manifest`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: adm.manifest?.items ?? [], action: "publish" }),
    });
    await login(creds.tier1);
    const repub = await gManifest();
    push("after republish 5 items", repub.status === 200 && repub.n === 5, `${repub.status} n=${repub.n}`);

    await login(creds.tier2);
    const fdBad = new FormData();
    fdBad.set("files", new Blob(["not-image"], { type: "text/plain" }), "x.txt");
    const badUp = await fetch(`/api/admin/gallery/${slug}/upload`, {
      method: "POST",
      credentials: "include",
      body: fdBad,
    });
    push("upload non-image 400", badUp.status === 400, badUp.status);

    const audit = await fetch(`/api/admin/gallery/${slug}/audit`, { credentials: "include" });
    push("admin audit GET 200", audit.status === 200, audit.status);

    const final5 = await gManifest();
    push("final published count 5", final5.n === 5, final5.n);

    return { base, at: new Date().toISOString(), tests };
  });
}
