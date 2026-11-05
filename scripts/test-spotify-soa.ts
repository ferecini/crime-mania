/**
 * Testes Spotify SOA (sem rede / sem Postgres): entitlements, JWT, config.
 * Uso: npm run test:spotify-soa
 */
import assert from "node:assert/strict";
import { decodeProtectedHeader, jwtVerify } from "jose";
import {
  getSpotifySoaRedirectUri,
  isSpotifySoaEnabled,
  isSpotifySoaReady,
} from "../src/lib/spotify-soa/config";
import { isSoaEligibleTier, tierToEntitlements } from "../src/lib/spotify-soa/entitlements";
import { signSoaPayload } from "../src/lib/spotify-soa/jwt";
import { syncSpotifyEntitlementsForUser } from "../src/lib/spotify-soa/sync";
import { QA_USER_IDS } from "../src/lib/auth/qa-users";

async function main() {
  delete process.env.SPOTIFY_SOA_ENTITLEMENT_TIER1;
  delete process.env.SPOTIFY_SOA_ENTITLEMENT_TIER2;

  // tierToEntitlements
  assert.deepEqual(tierToEntitlements("tier1"), ["tier1"]);
  assert.deepEqual(tierToEntitlements("tier2"), ["tier2"]);
  assert.deepEqual(tierToEntitlements("none"), []);
  process.env.SPOTIFY_SOA_ENTITLEMENT_TIER1 = "cm-basic";
  process.env.SPOTIFY_SOA_ENTITLEMENT_TIER2 = "cm-premium";
  assert.deepEqual(tierToEntitlements("tier1"), ["cm-basic"]);
  assert.deepEqual(tierToEntitlements("tier2"), ["cm-premium"]);
  delete process.env.SPOTIFY_SOA_ENTITLEMENT_TIER1;
  delete process.env.SPOTIFY_SOA_ENTITLEMENT_TIER2;
  assert.equal(isSoaEligibleTier("none"), false);
  assert.equal(isSoaEligibleTier("tier1"), true);

  // JWT shape
  const secret = "test-client-secret-with-enough-length-0123456789";
  const jwt = await signSoaPayload(
    { partner_id: "partner-1", partner_user_id: "user-1", entitlements: ["tier1"] },
    secret,
  );
  assert.equal(decodeProtectedHeader(jwt).alg, "HS256");
  const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret), {
    algorithms: ["HS256"],
  });
  assert.equal(payload.partner_id, "partner-1");
  assert.equal(payload.partner_user_id, "user-1");
  assert.deepEqual(payload.entitlements, ["tier1"]);
  await assert.rejects(
    jwtVerify(jwt, new TextEncoder().encode("wrong-secret-wrong-secret-wrong-secret")),
  );

  const empty = await signSoaPayload(
    { partner_id: "p", partner_user_id: "u", entitlements: [] },
    secret,
  );
  const decoded = await jwtVerify(empty, new TextEncoder().encode(secret));
  assert.deepEqual(decoded.payload.entitlements, []);

  // config / flag
  delete process.env.SPOTIFY_SOA_ENABLED;
  assert.equal(isSpotifySoaEnabled(), false);
  process.env.SPOTIFY_SOA_ENABLED = "true";
  assert.equal(isSpotifySoaEnabled(), true);
  assert.equal(isSpotifySoaReady(), false, "sem credenciais não está pronto");
  process.env.APP_BASE_URL = "https://example.test/";
  assert.equal(getSpotifySoaRedirectUri(), "https://example.test/api/spotify/soa/callback");

  // sync: no-op quando desligado e para usuários de QA
  delete process.env.SPOTIFY_SOA_ENABLED;
  assert.deepEqual(await syncSpotifyEntitlementsForUser("any-user"), {
    synced: false,
    reason: "disabled",
  });
  process.env.SPOTIFY_SOA_ENABLED = "true";
  process.env.SPOTIFY_SOA_CLIENT_ID = "cid";
  process.env.SPOTIFY_SOA_CLIENT_SECRET = secret;
  process.env.SPOTIFY_SOA_PARTNER_ID = "partner-1";
  assert.deepEqual(await syncSpotifyEntitlementsForUser(QA_USER_IDS.tier1), {
    synced: false,
    reason: "qa_user",
  });

  console.log("test-spotify-soa: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
