import { NextResponse } from "next/server";
import {
  communityRepo,
  jsonError,
  requireForumRead,
  requireForumWrite,
} from "@/lib/community/api-helpers";
import { isCommunityModerator } from "@/lib/community/access";
import { displayNameForMemberId } from "@/lib/community/member-display";
import { sanitizeCommunityText } from "@/lib/community/sanitize";
import { topicPatchSchema } from "@/lib/community/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireForumRead();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const repo = await communityRepo();
    const topic = await repo.getTopic(id);
    if (!topic) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    const mod = isCommunityModerator(auth.session);
    if ((topic.status === "hidden" || topic.status === "removed") && !mod) {
      return NextResponse.json({ error: "Conteúdo indisponível." }, { status: 410 });
    }
    const replies = await repo.listReplies(id);
    return NextResponse.json({
      topic: { ...topic, authorDisplayName: displayNameForMemberId(topic.authorId) },
      replies: replies.map((r) => ({
        ...r,
        authorDisplayName: displayNameForMemberId(r.authorId),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireForumWrite();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = topicPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const patch: { title?: string; body?: string } = {};
    if (parsed.data.title) patch.title = sanitizeCommunityText(parsed.data.title, 120);
    if (parsed.data.body) patch.body = sanitizeCommunityText(parsed.data.body, 8000);
    const repo = await communityRepo();
    const topic = await repo.updateTopicOwn(id, auth.session.id, patch);
    return NextResponse.json({
      topic: { ...topic, authorDisplayName: displayNameForMemberId(topic.authorId) },
    });
  } catch (err) {
    return jsonError(err);
  }
}
