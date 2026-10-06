import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { writeAdminAudit } from "@/lib/dossier/db";
import { deleteMemberMedia, listMemberMedia, upsertMemberMedia } from "@/lib/admin/media-db";

export async function GET(request: Request) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const section = url.searchParams.get("section") as "episodes" | "juris" | "archive" | null;
  const items = await listMemberMedia(section ?? undefined);
  return NextResponse.json({ items });
}

const upsertSchema = z.object({
  id: z.string().optional(),
  section: z.enum(["episodes", "juris", "archive"]),
  slug: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  durationSeconds: z.number().int().nullable().optional(),
  mediaType: z.enum(["audio", "video"]),
  provider: z.string().default("blob"),
  storageKey: z.string().nullable().optional(),
  streamPath: z.string().nullable().optional(),
  accessTier: z.enum(["tier1", "tier2"]).default("tier2"),
  dossierSlug: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function POST(request: Request) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const parsed = upsertSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  if (parsed.data.provider === "youtube") {
    return NextResponse.json({ error: "YouTube não é permitido para conteúdo pago." }, { status: 400 });
  }
  const row = await upsertMemberMedia({
    id: parsed.data.id,
    section: parsed.data.section,
    slug: parsed.data.slug ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    durationSeconds: parsed.data.durationSeconds ?? null,
    mediaType: parsed.data.mediaType,
    provider: parsed.data.provider,
    storageKey: parsed.data.storageKey ?? null,
    streamPath: parsed.data.streamPath ?? null,
    accessTier: parsed.data.accessTier,
    dossierSlug: parsed.data.dossierSlug ?? null,
    status: parsed.data.status,
  });
  await writeAdminAudit({
    actorId: auth.session.id,
    action: "member_media_upsert",
    detail: { id: row.id, section: row.section },
  });
  return NextResponse.json({ ok: true, item: row });
}

export async function DELETE(request: Request) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });
  await deleteMemberMedia(id);
  await writeAdminAudit({ actorId: auth.session.id, action: "member_media_delete", detail: { id } });
  return NextResponse.json({ ok: true });
}
