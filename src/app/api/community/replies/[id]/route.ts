import { NextResponse } from "next/server";
import {
  communityRepo,
  jsonError,
  requireForumWrite,
} from "@/lib/community/api-helpers";
import { displayNameForMemberId } from "@/lib/community/member-display";
import { sanitizeCommunityText } from "@/lib/community/sanitize";
import { replySchema } from "@/lib/community/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireForumWrite();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const text = sanitizeCommunityText(parsed.data.body, 6000);
    const repo = await communityRepo();
    const reply = await repo.updateReplyOwn(id, auth.session.id, text);
    return NextResponse.json({
      reply: { ...reply, authorDisplayName: displayNameForMemberId(reply.authorId) },
    });
  } catch (err) {
    return jsonError(err);
  }
}
