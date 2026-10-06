import { NextResponse } from "next/server";
import {
  communityRepo,
  jsonError,
  requireSuggestionWrite,
} from "@/lib/community/api-helpers";
import { assertRateLimit } from "@/lib/community/rate-limit";
import { sanitizeCommunityText, sanitizeHttpUrls } from "@/lib/community/sanitize";
import { suggestionSchema } from "@/lib/community/schemas";

const recentTokens = new Map<string, number>();
const TOKEN_TTL_MS = 60 * 60 * 1000;

function consumeToken(userId: string, token: string | undefined): boolean {
  if (!token) return true;
  const key = `${userId}:${token}`;
  const now = Date.now();
  const prev = recentTokens.get(key);
  if (prev && now - prev < TOKEN_TTL_MS) return false;
  recentTokens.set(key, now);
  return true;
}

export async function GET() {
  const auth = await requireSuggestionWrite();
  if ("error" in auth) return auth.error;
  try {
    const repo = await communityRepo();
    const suggestions = await repo.listSuggestionsByAuthor(auth.session.id);
    return NextResponse.json({ suggestions });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireSuggestionWrite();
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    const parsed = suggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    if (!consumeToken(auth.session.id, parsed.data.clientToken)) {
      return NextResponse.json({ error: "Envio duplicado." }, { status: 409 });
    }
    const repo = await communityRepo();
    await assertRateLimit(repo, auth.session.id, "suggestionCreate");
    const caseTitle = sanitizeCommunityText(parsed.data.caseTitle, 160);
    const location = parsed.data.location
      ? sanitizeCommunityText(parsed.data.location, 160)
      : undefined;
    const summary = sanitizeCommunityText(parsed.data.summary, 4000);
    const relevance = sanitizeCommunityText(parsed.data.relevance, 2000);
    const sourceLinks = sanitizeHttpUrls(parsed.data.sourceLinks, 8, 2048);
    const similar = await repo.findSimilarSuggestions(caseTitle, auth.session.id);
    const suggestion = await repo.createSuggestion({
      authorId: auth.session.id,
      caseTitle,
      location,
      summary,
      relevance,
      sourceLinks,
      sensitiveContent: parsed.data.sensitiveContent,
      noPrivateDataConfirmed: parsed.data.noPrivateDataConfirmed,
      status: "received",
    });
    await repo.recordAction(auth.session.id, "suggestionCreate");
    return NextResponse.json({
      suggestion,
      similar: similar.map((s) => ({ id: s.id, caseTitle: s.caseTitle, status: s.status })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
