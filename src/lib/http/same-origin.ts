/** Mitiga CSRF em rotas autenticadas por cookie (POST mutável). */
export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) return process.env.NODE_ENV !== "production";
    try {
      return new URL(referer).host === new URL(request.url).host;
    } catch {
      return false;
    }
  }
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
