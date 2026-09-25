const OEMBED = "https://open.spotify.com/oembed";

export async function isSpotifyEmbedAvailable(
  openEpisodeId: string,
): Promise<boolean> {
  if (!/^[a-zA-Z0-9]{22}$/.test(openEpisodeId)) return false;
  const target = `https://open.spotify.com/episode/${openEpisodeId}`;
  try {
    const res = await fetch(`${OEMBED}?url=${encodeURIComponent(target)}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { html?: string };
    return Boolean(data.html?.includes("open.spotify.com/embed"));
  } catch {
    return false;
  }
}

export function spotifyOpenEpisodeUrl(openEpisodeId: string): string {
  return `https://open.spotify.com/episode/${openEpisodeId}`;
}
