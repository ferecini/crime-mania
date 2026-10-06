import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_SEC = 300;

function mediaSecret(): string | null {
  return (
    process.env.CM_DOSSIER_MEDIA_SECRET?.trim() ??
    process.env.CM_DOSSIER_WORKER_SECRET?.trim() ??
    null
  );
}

export function signDossierBlockUrl(input: {
  sessionId: string;
  slug: string;
  blockId: string;
  width: number;
  format: string;
  nowSec?: number;
}): string {
  const secret = mediaSecret();
  if (!secret) return "";
  const exp = (input.nowSec ?? Math.floor(Date.now() / 1000)) + TTL_SEC;
  const payload = `${input.sessionId}|${input.slug}|${input.blockId}|${input.width}|${input.format}|${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${exp}.${sig}`;
}

export function verifyDossierBlockSignature(input: {
  sessionId: string;
  slug: string;
  blockId: string;
  width: number;
  format: string;
  token: string;
}): boolean {
  const secret = mediaSecret();
  if (!secret) return false;
  const [expStr, sig] = input.token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const payload = `${input.sessionId}|${input.slug}|${input.blockId}|${input.width}|${input.format}|${exp}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}
