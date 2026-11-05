import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  SPOTIFY_SOA_AUTHORIZE_URL,
  SPOTIFY_SOA_LINK_SCOPE,
  getSpotifySoaCredentials,
  getSpotifySoaRedirectUri,
  isSpotifySoaReady,
} from "@/lib/spotify-soa/config";
import { isSoaEligibleTier } from "@/lib/spotify-soa/entitlements";
import { setSpotifySoaStateCookie } from "@/lib/spotify-soa/state";

function toAccount(request: Request, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/membro/conta?spotify=${code}`, request.url));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(
      new URL("/entrar?next=/membro/spotify/conectar", request.url),
    );
  }

  if (!isSpotifySoaReady()) return toAccount(request, "disabled");
  if (session.isTestUser) return toAccount(request, "qa");
  // session.tier já vem de getBillingEffectiveTier: pagamento pendente => "none".
  if (!isSoaEligibleTier(session.tier)) return toAccount(request, "no_plan");

  const state = await setSpotifySoaStateCookie(session.id);
  const { clientId } = getSpotifySoaCredentials();
  const url = new URL(SPOTIFY_SOA_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", getSpotifySoaRedirectUri());
  url.searchParams.set("scope", SPOTIFY_SOA_LINK_SCOPE);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
