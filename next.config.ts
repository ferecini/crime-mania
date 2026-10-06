import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "sharp"],
  outputFileTracingIncludes: {
    "/api/admin/dossier/upload": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/admin/dossier/worker": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  async redirects() {
    return [
      {
        source: "/membro/exclusivo",
        destination: "/membro/episodios",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3t3ozftmdmh3i.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https:",
              "media-src 'self' https: blob:",
              "frame-src 'self' https://open.spotify.com https://www.youtube.com https://www.youtube-nocookie.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
