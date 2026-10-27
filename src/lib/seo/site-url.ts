const DEFAULT_SITE_URL = "https://crimemania.com.br";

/** URL pública canônica (sem barra final). */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const raw = fromEnv || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
