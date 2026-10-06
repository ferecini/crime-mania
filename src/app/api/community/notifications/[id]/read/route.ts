import { NextResponse } from "next/server";
import { communityRepo, jsonError, requireSession } from "@/lib/community/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const repo = await communityRepo();
    await repo.markNotificationRead(auth.session.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
