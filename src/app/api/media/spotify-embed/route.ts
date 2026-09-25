import { NextResponse } from "next/server";
import { isSpotifyEmbedAvailable } from "@/lib/media/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "ID ausente." }, { status: 400 });
  }
  const ok = await isSpotifyEmbedAvailable(id);
  return NextResponse.json({ ok, id });
}
