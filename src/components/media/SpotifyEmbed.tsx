interface SpotifyEmbedProps {
  episodeId: string;
  title: string;
}

export function SpotifyEmbed({ episodeId, title }: SpotifyEmbedProps) {
  const src = `https://open.spotify.com/embed/episode/${episodeId}?utm_source=generator&theme=0`;
  return (
    <div className="overflow-hidden rounded-sm border border-cm-gray-dark bg-black">
      <iframe
        title={`Spotify — ${title}`}
        src={src}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block w-full border-0"
      />
    </div>
  );
}
