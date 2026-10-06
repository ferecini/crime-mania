const BLOCKED =
  /javascript:|data:text\/html|<script|<iframe|on\w+\s*=|<img\s|<object|<embed/i;

export function sanitizeCommunityText(input: string, maxLen: number): string {
  let text = input.replace(/\r\n/g, "\n").trim();
  text = text.replace(/<[^>]*>/g, "");
  if (BLOCKED.test(text)) {
    throw new Error("Conteúdo não permitido.");
  }
  if (text.length > maxLen) {
    throw new Error(`Texto excede ${maxLen} caracteres.`);
  }
  return text;
}

export function sanitizeHttpUrls(urls: string[], maxCount: number, maxLenEach: number): string[] {
  const out: string[] = [];
  for (const raw of urls) {
    const u = raw.trim();
    if (!u) continue;
    let parsed: URL;
    try {
      parsed = new URL(u);
    } catch {
      throw new Error("URL inválida.");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Somente links http ou https.");
    }
    if (u.length > maxLenEach) throw new Error("URL longa demais.");
    out.push(parsed.toString());
    if (out.length > maxCount) throw new Error(`Máximo de ${maxCount} links.`);
  }
  return out;
}
