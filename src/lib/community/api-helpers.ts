import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  canReadForum,
  canSuggestEpisode,
  canWriteForum,
  isCommunityModerator,
} from "@/lib/community/access";
import { getCommunityRepository } from "@/lib/community/repository";
import { RateLimitError } from "@/lib/community/rate-limit";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Sessão expirada ou não autenticado." }, { status: 401 }) };
  }
  return { session };
}

export async function requireForumRead() {
  const r = await requireSession();
  if ("error" in r) return r;
  if (!canReadForum(r.session)) {
    return { error: NextResponse.json({ error: "Plano insuficiente." }, { status: 403 }) };
  }
  return r;
}

export async function requireForumWrite() {
  const r = await requireForumRead();
  if ("error" in r) return r;
  if (!canWriteForum(r.session)) {
    return { error: NextResponse.json({ error: "Plano insuficiente." }, { status: 403 }) };
  }
  return r;
}

export async function requireSuggestionWrite() {
  const r = await requireSession();
  if ("error" in r) return r;
  if (!canSuggestEpisode(r.session)) {
    return { error: NextResponse.json({ error: "Sugestões disponíveis apenas no Tier 2." }, { status: 403 }) };
  }
  return r;
}

export async function requireModerator() {
  const r = await requireSession();
  if ("error" in r) return r;
  if (!isCommunityModerator(r.session)) {
    return { error: NextResponse.json({ error: "Não autorizado." }, { status: 403 }) };
  }
  return r;
}

export function jsonError(err: unknown) {
  if (err instanceof RateLimitError) {
    return NextResponse.json({ error: err.message }, { status: 429 });
  }
  const message = err instanceof Error ? err.message : "Erro interno.";
  const status = message.includes("Sem permissão") ? 403 : message.includes("não encontrad") ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function communityRepo() {
  return getCommunityRepository();
}
