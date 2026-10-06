import { NextResponse } from "next/server";
import {
  communityRepo,
  jsonError,
  requireForumWrite,
} from "@/lib/community/api-helpers";
import { displayNameForMemberId } from "@/lib/community/member-display";
import { notifyTopicParticipantsOnReply } from "@/lib/community/notifications";
import { assertRateLimit } from "@/lib/community/rate-limit";
import { sanitizeCommunityText } from "@/lib/community/sanitize";
import { replySchema } from "@/lib/community/schemas";
import { COMMUNITY_RULES_VERSION } from "@/lib/community/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireForumWrite();
  if ("error" in auth) return auth.error;
  const { id: topicId } = await params;
  try {
    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const repo = await communityRepo();
    const accepted = await repo.hasAcceptedRules(auth.session.id, COMMUNITY_RULES_VERSION);
    if (!accepted) {
      return NextResponse.json({ error: "Aceite as regras da comunidade antes de publicar." }, { status: 428 });
    }
    await assertRateLimit(repo, auth.session.id, "replyCreate");
    const text = sanitizeCommunityText(parsed.data.body, 6000);
    const topic = await repo.getTopic(topicId);
    if (!topic) return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });
    const existing = await repo.listReplies(topicId);
    const reply = await repo.createReply({
      topicId,
      authorId: auth.session.id,
      body: text,
    });
    await repo.recordAction(auth.session.id, "replyCreate");
    await notifyTopicParticipantsOnReply(
      repo,
      topicId,
      topic.authorId,
      topic.title,
      auth.session.id,
      existing.map((r) => r.authorId),
    );
    return NextResponse.json({
      reply: { ...reply, authorDisplayName: displayNameForMemberId(reply.authorId) },
    });
  } catch (err) {
    return jsonError(err);
  }
}
