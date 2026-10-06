import { NextResponse } from "next/server";
import {
  communityRepo,
  jsonError,
  requireForumRead,
  requireSession,
} from "@/lib/community/api-helpers";
import { COMMUNITY_RULES_MARKDOWN } from "@/lib/community/rules-content";
import { COMMUNITY_RULES_VERSION } from "@/lib/community/types";

export async function GET() {
  const auth = await requireForumRead();
  if ("error" in auth) return auth.error;
  try {
    const repo = await communityRepo();
    const accepted = await repo.hasAcceptedRules(auth.session.id, COMMUNITY_RULES_VERSION);
    return NextResponse.json({
      version: COMMUNITY_RULES_VERSION,
      accepted,
      rulesMarkdown: COMMUNITY_RULES_MARKDOWN,
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  try {
    const repo = await communityRepo();
    await repo.acceptRules(auth.session.id, COMMUNITY_RULES_VERSION);
    return NextResponse.json({ ok: true, version: COMMUNITY_RULES_VERSION });
  } catch (err) {
    return jsonError(err);
  }
}
