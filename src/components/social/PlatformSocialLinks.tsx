import {
  INSTAGRAM_URL,
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/data/episodes";

const linkClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[4px] border border-cm-divider bg-black/20 transition hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white";

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <defs>
        <linearGradient id="cm-ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FD5949" />
          <stop offset="50%" stopColor="#D6249F" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
      <path
        fill="url(#cm-ig)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.017 7.052.072 5.775.127 4.602.333 3.585 1.35 2.568 2.367 2.362 3.54 2.307 4.817.017 8.332 0 8.741 0 12c0 3.259.017 3.668.072 4.948.055 1.277.261 2.45 1.278 3.467 1.017 1.017 2.19 1.223 3.467 1.278C8.332 23.983 8.741 24 12 24c3.259 0 3.668-.017 4.948-.072 1.277-.055 2.45-.261 3.467-1.278 1.017-1.017 1.223-2.19 1.278-3.467.055-1.28.072-1.689.072-4.948 0-3.259-.017-3.668-.072-4.948-.055-1.277-.261-2.45-1.278-3.467C21.633 4.602 20.46 4.396 19.183 4.341 17.903 4.017 17.494 4 14.235 4h-4.47zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#1DB954"
        d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.49 17.308c-.215.353-.672.464-1.025.25-2.815-1.72-6.354-2.11-10.53-1.16-.402.092-.804-.158-.896-.56-.092-.403.158-.805.56-.897 4.568-1.04 8.504-.602 11.656 1.326.353.214.464.672.235 1.041zm1.47-3.275c-.271.438-.847.576-1.285.305-3.22-1.98-8.135-2.554-11.95-1.397-.495.15-1.018-.128-1.168-.623-.15-.495.128-1.018.623-1.168 4.358-1.322 9.776-.697 13.443 1.515.438.271.576.847.337 1.368zm.126-3.418C14.692 8.095 8.687 7.894 5.052 9.013c-.593.18-1.22-.152-1.4-.745-.18-.593.152-1.22.745-1.4 4.147-1.257 10.856-1.018 15.01 1.352.534.323.705 1.018.382 1.552-.323.534-1.018.705-1.552.382z"
      />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="24" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#FF0000"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
    </svg>
  );
}

export function PlatformSocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`}>
      <li>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Abrir Crime Mania no Instagram"
        >
          <InstagramIcon />
        </a>
      </li>
      <li>
        <a
          href={SPOTIFY_SHOW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Abrir Crime Mania no Spotify"
        >
          <SpotifyIcon />
        </a>
      </li>
      <li>
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label="Abrir Crime Mania no YouTube"
        >
          <YouTubeIcon />
        </a>
      </li>
    </ul>
  );
}
