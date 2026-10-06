#!/usr/bin/env node
/**
 * Abre Chrome nas páginas de config OAuth (Google + Vercel).
 * Uso: node scripts/open-oauth-setup.mjs
 */
import { execSync } from "node:child_process";

const urls = [
  "https://console.cloud.google.com/apis/credentials",
  "https://console.cloud.google.com/apis/credentials/oauthclient",
  "https://vercel.com/investwise/crime-mania/settings/environment-variables",
];

for (const url of urls) {
  try {
    execSync(`open "${url}"`, { stdio: "inherit" });
  } catch {
    console.error("Falha ao abrir:", url);
  }
}

console.log(`
Redirect URIs (copie no Google):
  https://crime-mania.vercel.app/api/auth/google/callback
  http://localhost:3000/api/auth/google/callback

Variáveis na Vercel (Production):
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  NEXT_PUBLIC_GOOGLE_CLIENT_ID (= mesmo Client ID)
`);
