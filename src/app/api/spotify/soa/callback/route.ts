import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertBillingAccountAllowed } from "@/lib/billing/billing-account";
import { exchangeAuthorizationCode, registerUser } from "@/lib/spotify-soa/client";
import { getSpotifySoaRedirectUri, isSpotifySoaReady } from "@/lib/spotify-soa/config";
import { upsertSpotifySoaLink } from "@/lib/spotify-soa/db";
import { isSoaEligibleTier, tierToEntitlements } from "@/lib/spotify-soa/entitlements";
import { consumeSpotifySoaState } from "@/lib/spotify-soa/state";

function toAccount(request: Request, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/membro/conta?spotify=${code}`, request.url));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/entrar?next=/membro/conta", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const stateOk = await consumeSpotifySoaState(state, session.id);

  if (!isSpotifySoaReady()) return toAccount(request, "disabled");
  if (searchParams.get("error")) return toAccount(request, "error");
  if (!stateOk || !code) return toAccount(request, "error");
  if (session.isTestUser) return toAccount(request, "qa");
  if (!isSoaEligibleTier(session.tier)) return toAccount(request, "no_plan");

  try {
    assertBillingAccountAllowed(session.id, { isTestUser: session.isTestUser, email: session.email });
    const entitlements = tierToEntitlements(session.tier);
    const accessToken = await exchangeAuthorizationCode(code, getSpotifySoaRedirectUri());
    const { completionUrl } = await registerUser(accessToken, session.id, entitlements);

    const completion = new URL(completionUrl);
    if (completion.protocol !== "https:") throw new Error("completion_url inválida.");

    await upsertSpotifySoaLink(session.id, entitlements).catch((err) => {
      console.error("[spotify-soa] auditoria falhou:", err instanceof Error ? err.message : err);
    });
    return NextResponse.redirect(completion);
  } catch (err) {
    console.error("[spotify-soa] callback falhou:", err instanceof Error ? err.message : err);
    return toAccount(request, "error");
  }
}
