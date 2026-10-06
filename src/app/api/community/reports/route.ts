import { NextResponse } from "next/server";
import {
  communityRepo,
  jsonError,
  requireForumWrite,
} from "@/lib/community/api-helpers";
import { assertRateLimit } from "@/lib/community/rate-limit";
import { reportSchema } from "@/lib/community/schemas";

export async function POST(request: Request) {
  const auth = await requireForumWrite();
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const repo = await communityRepo();
    await assertRateLimit(repo, auth.session.id, "reportCreate");
    await repo.createReport({
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reporterId: auth.session.id,
      reason: parsed.data.reason,
      detail: parsed.data.detail,
    });
    await repo.recordAction(auth.session.id, "reportCreate");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
