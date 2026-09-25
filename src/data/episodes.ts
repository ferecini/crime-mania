export type EpisodeCategory =
  | "ASSASSINATO"
  | "PREDADOR"
  | "MISTÉRIO"
  | "DESAPARECIDA";

export interface PublicEpisode {
  slug: string;
  number: number;
  category: EpisodeCategory;
  title: string;
  summary: string;
  duration: string;
  publishedAt: string;
  coverImage: string;
  spotifyEpisodeId: string;
  spotifyUrl: string;
  youtubeVideoId?: string;
}

const PODCAST_COVER =
  "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/11162378/11162378-1613768383181-90894aebfa963.jpg";

export const PUBLIC_EPISODES: PublicEpisode[] = [
  {
    slug: "carol-stuart",
    number: 126,
    category: "ASSASSINATO",
    title: "Carol Stuart",
    summary:
      "Charles e Carol Stuart pareciam ter a vida perfeita em Boston — até uma noite fatídica em 1989 mudar tudo e expor um crime que chocou a região.",
    duration: "35:51",
    publishedAt: "2023-11-09",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910505464-e90ef2c4e74ba.jpg",
    spotifyEpisodeId: "e2bnjbv",
    spotifyUrl:
      "https://podcasters.spotify.com/pod/show/guria-studios/episodes/ASSASSINATO-Carol-Stuart-e2bnjbv",
  },
  {
    slug: "mabs-dottie-monica-alecia",
    number: 125,
    category: "PREDADOR",
    title: "Mabs, Dottie, Monica e Alecia",
    summary:
      "Quatro desaparecimentos em Reno, 1987: uma busca que revelou mentiras surpreendentes e um desfecho grotesco.",
    duration: "33:11",
    publishedAt: "2023-10-19",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910410251-d0cd73580720f.jpg",
    spotifyEpisodeId: "e2aphom",
    spotifyUrl:
      "https://podcasters.spotify.com/pod/show/guria-studios/episodes/PREDADOR-Mabs--Dottie--Monica-e-Alecia-e2aphom",
  },
  {
    slug: "raynella-david",
    number: 124,
    category: "MISTÉRIO",
    title: "Raynella e David",
    summary:
      "Um corpo baleado em casa no Tennessee parecia suicídio — até investigadores repensarem tudo ao redor de uma figura sempre próxima da morte.",
    duration: "22:52",
    publishedAt: "2023-10-12",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910434796-5273ddd29d3a5.jpg",
    spotifyEpisodeId: "e2agc5b",
    spotifyUrl:
      "https://podcasters.spotify.com/pod/show/guria-studios/episodes/MISTRIO-Raynella-e-David-e2agc5b",
  },
  {
    slug: "gailen-thurnau",
    number: 123,
    category: "ASSASSINATO",
    title: "Gailen Thurnau",
    summary:
      "Gene tinha trabalho, família e rotina em Nebraska — até o pedido de divórcio e uma tragédia que chegou como um furacão.",
    duration: "30:36",
    publishedAt: "2023-10-05",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910469957-e6f769ad02c2.jpg",
    spotifyEpisodeId: "e2a75p2",
    spotifyUrl:
      "https://podcasters.spotify.com/pod/show/guria-studios/episodes/ASSASSINATO-Gailen-Thurnau-e2a75p2",
  },
  {
    slug: "stephanie-scott",
    number: 122,
    category: "ASSASSINATO",
    title: "Stephanie Scott",
    summary:
      "A professora australiana estava a uma semana do casamento quando desapareceu após ir à escola — um caso que mostrou o mal escondido no cotidiano.",
    duration: "35:12",
    publishedAt: "2023-09-28",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910556047-6f39f85db2244.jpg",
    spotifyEpisodeId: "e29tve1",
    spotifyUrl:
      "https://podcasters.spotify.com/pod/show/guria-studios/episodes/ASSASSINATO-Stephanie-Scott-e29tve1",
  },
  {
    slug: "kenia-monge",
    number: 121,
    category: "DESAPARECIDA",
    title: "Kenia Monge",
    summary:
      "Kenia sumiu no centro de Denver em 2011; uma mensagem misteriosa no celular elevou as suspeitas enquanto a comunidade esperava por respostas.",
    duration: "30:00",
    publishedAt: "2023-09-21",
    coverImage: PODCAST_COVER,
    spotifyEpisodeId: "e29kama",
    spotifyUrl:
      "https://podcasters.spotify.com/pod/show/guria-studios/episodes/DESAPARECIDA-Kenia-Monge-e29kama",
  },
];

export function getEpisodeBySlug(slug: string): PublicEpisode | undefined {
  return PUBLIC_EPISODES.find((e) => e.slug === slug);
}

export const SPOTIFY_SHOW_URL =
  "https://open.spotify.com/show/0QJ8xJZQZQZQZQZQZQZQZQ";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@crimemania";
export const INSTAGRAM_URL = "https://www.instagram.com/crimemania/";
export const SITE_URL = "https://www.crimemania.com.br/";
