import { NextResponse } from "next/server";
import { communityRepo, jsonError, requireSession } from "@/lib/community/api-helpers";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  try {
    const repo = await communityRepo();
    const notifications = await repo.listNotifications(auth.session.id);
    return NextResponse.json({ notifications });
  } catch (err) {
    return jsonError(err);
  }
}
