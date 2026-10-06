import { NextResponse } from "next/server";
import { communityRepo, jsonError, requireForumRead } from "@/lib/community/api-helpers";

export async function GET() {
  const auth = await requireForumRead();
  if ("error" in auth) return auth.error;
  try {
    const repo = await communityRepo();
    const categories = await repo.listCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return jsonError(err);
  }
}
