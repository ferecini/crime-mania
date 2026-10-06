import { NextResponse } from "next/server";
import {
  communityRepo,
  jsonError,
  requireForumRead,
  requireForumWrite,
} from "@/lib/community/api-helpers";
import { displayNameForMemberId } from "@/lib/community/member-display";
import { assertRateLimit } from "@/lib/community/rate-limit";
import { sanitizeCommunityText } from "@/lib/community/sanitize";
import { topicCreateSchema } from "@/lib/community/schemas";
import { COMMUNITY_RULES_VERSION } from "@/lib/community/types";

export async function GET(request: Request) {
  const auth = await requireForumRead();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "20");
  try {
    const repo = await communityRepo();
    const { topics, nextCursor } = await repo.listTopics({ cursor, categoryId, limit });
    const enriched = topics.map((t) => ({
      ...t,
      authorDisplayName: displayNameForMemberId(t.authorId),
    }));
    return NextResponse.json({ topics: enriched, nextCursor });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireForumWrite();
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const parsed = topicCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const repo = await communityRepo();
    const accepted = await repo.hasAcceptedRules(auth.session.id, COMMUNITY_RULES_VERSION);
    if (!accepted) {
      return NextResponse.json({ error: "Aceite as regras da comunidade antes de publicar." }, { status: 428 });
    }
    await assertRateLimit(repo, auth.session.id, "topicCreate");
    const title = sanitizeCommunityText(parsed.data.title, 120);
    const text = sanitizeCommunityText(parsed.data.body, 8000);
    const topic = await repo.createTopic({
      title,
      body: text,
      categoryId: parsed.data.categoryId,
      authorId: auth.session.id,
    });
    await repo.recordAction(auth.session.id, "topicCreate");
    return NextResponse.json({
      topic: { ...topic, authorDisplayName: displayNameForMemberId(topic.authorId) },
    });
  } catch (err) {
    return jsonError(err);
  }
}
