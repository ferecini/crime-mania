export type SubscriptionTier = "none" | "tier1" | "tier2";

export type PlanId =
  | "tier1-monthly"
  | "tier2-monthly"
  | "tier1-yearly"
  | "tier2-yearly";

export interface Plan {
  id: PlanId;
  name: string;
  tier: Exclude<SubscriptionTier, "none">;
  billing: "monthly" | "annual";
  /** Exibido quando billingEnabled=false ou preço ainda não publicado. */
  priceLabel: string;
  priceNote: string;
  billingDetail: string;
  cancelPolicy: string;
  highlight?: boolean;
  recommendedReason?: string;
}

function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const PLANS: Plan[] = [
  {
    id: "tier1-monthly",
    name: "Tier 1 — Acesso básico",
    tier: "tier1",
    billing: "monthly",
    priceLabel: formatBrl(900),
    priceNote: "Cobrança mensal · renovação automática · sem trial",
    billingDetail: "Acesso liberado após confirmação do pagamento.",
    cancelPolicy: "Cancele quando quiser — sem multa; acesso até o fim do ciclo pago.",
  },
  {
    id: "tier2-monthly",
    name: "Tier 2 — Acesso premium",
    tier: "tier2",
    billing: "monthly",
    priceLabel: formatBrl(2900),
    priceNote: "Cobrança mensal · acesso premium completo",
    billingDetail: "Inclui Arquivo, Juris, exclusivos e comunidade avançada.",
    cancelPolicy: "Cancele quando quiser — sem multa; acesso até o fim do ciclo pago.",
    highlight: true,
    recommendedReason: "Melhor para quem quer Arquivo, Juris e conteúdo exclusivo.",
  },
  {
    id: "tier1-yearly",
    name: "Tier 1 — Anual",
    tier: "tier1",
    billing: "annual",
    priceLabel: formatBrl(9900),
    priceNote: "Cobrança anual · equivalente a economia vs 12× mensal",
    billingDetail: "Mesmos benefícios Tier 1 · ciclo de 12 meses.",
    cancelPolicy: "Cancele quando quiser — sem multa; acesso até o fim do período anual pago.",
  },
  {
    id: "tier2-yearly",
    name: "Tier 2 — Acesso total",
    tier: "tier2",
    billing: "annual",
    priceLabel: formatBrl(15900),
    priceNote: "Lançamento: de R$ 348/ano por R$ 159 — economize R$ 189",
    billingDetail:
      "R$ 159 renovam enquanto a assinatura estiver ativa. Novo cadastro após cancelamento usa o preço vigente do catálogo.",
    cancelPolicy: "Cancele quando quiser — sem multa; acesso até o fim do período anual pago.",
  },
];

export type FeatureKey =
  | "publicEpisodes"
  | "dossierSummary"
  | "dossierGallery"
  | "dossierMap"
  | "dossierTimeline"
  | "dossierTheories"
  | "dossierJuris"
  | "archive"
  | "exclusive"
  | "jurisCatalog"
  | "forum"
  | "caseSuggestion"
  | "shopDiscount";

export const FEATURE_MATRIX: Record<
  FeatureKey,
  { label: string; guest: boolean; registered: boolean; tier1: boolean; tier2: boolean }
> = {
  publicEpisodes: {
    label: "Episódios gratuitos (Spotify / YouTube)",
    guest: true,
    registered: true,
    tier1: true,
    tier2: true,
  },
  dossierSummary: {
    label: "Dossiê — resumo do caso",
    guest: false,
    registered: false,
    tier1: true,
    tier2: true,
  },
  dossierGallery: {
    label: "Dossiê — galeria de imagens",
    guest: false,
    registered: false,
    tier1: true,
    tier2: true,
  },
  dossierMap: {
    label: "Dossiê — mapa",
    guest: false,
    registered: false,
    tier1: true,
    tier2: true,
  },
  dossierTimeline: {
    label: "Dossiê — linha do tempo",
    guest: false,
    registered: false,
    tier1: true,
    tier2: true,
  },
  dossierTheories: {
    label: "Dossiê — teorias",
    guest: false,
    registered: false,
    tier1: true,
    tier2: true,
  },
  dossierJuris: {
    label: "Dossiê — Crime Mania Juris",
    guest: false,
    registered: false,
    tier1: false,
    tier2: true,
  },
  archive: {
    label: "Arquivo (casos não públicos em áudio)",
    guest: false,
    registered: false,
    tier1: false,
    tier2: true,
  },
  exclusive: {
    label: "Conteúdo exclusivo (áudio e vídeo)",
    guest: false,
    registered: false,
    tier1: false,
    tier2: true,
  },
  jurisCatalog: {
    label: "Crime Mania Juris (catálogo)",
    guest: false,
    registered: false,
    tier1: false,
    tier2: true,
  },
  forum: {
    label: "Fórum geral de discussão",
    guest: false,
    registered: false,
    tier1: true,
    tier2: true,
  },
  caseSuggestion: {
    label: "Sugestão de caso",
    guest: false,
    registered: false,
    tier1: false,
    tier2: true,
  },
  shopDiscount: {
    label: "Shop — 15% de desconto e prioridade",
    guest: false,
    registered: false,
    tier1: true,
    tier2: true,
  },
};

export function tierHasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  const row = FEATURE_MATRIX[feature];
  if (tier === "tier2") return row.tier2;
  if (tier === "tier1") return row.tier1;
  return false;
}

export function minTierForFeature(feature: FeatureKey): SubscriptionTier {
  const row = FEATURE_MATRIX[feature];
  if (row.tier1) return "tier1";
  if (row.tier2) return "tier2";
  return "tier2";
}

/** Tabela comercial resumida (UI) — permissões reais permanecem em FEATURE_MATRIX. */
export const PLAN_COMPARISON_ROWS = [
  {
    label: "Dossiê",
    tier1: true,
    tier2: true,
  },
  {
    label: "Conteúdos exclusivos",
    tier1: false,
    tier2: true,
  },
  {
    label: "Sugira um episódio",
    tier1: false,
    tier2: true,
  },
  {
    label: "Acesso antecipado aos episódios",
    tier1: false,
    tier2: true,
  },
  {
    label: "Fórum de discussão",
    tier1: true,
    tier2: true,
  },
  {
    label: "15% de desconto e prioridade nos lançamentos de produtos",
    tier1: true,
    tier2: true,
  },
  {
    label: "Acesso a todo nosso arquivo de episódios extras já publicados",
    tier1: false,
    tier2: true,
  },
] as const;

export const PLAN_COMPARISON_COLUMNS = [
  { key: "tier1" as const, label: "Tier 1 — Acesso básico" },
  { key: "tier2Premium" as const, label: "Tier 2 — Acesso premium" },
  { key: "tier2Total" as const, label: "Tier 2 — Acesso total" },
];

/** Benefícios-chave por plano (mobile). */
export const PLAN_HIGHLIGHTS: Record<PlanId, string[]> = {
  "tier1-monthly": [
    "Dossiê",
    "Fórum de discussão",
    "15% de desconto e prioridade no shop",
  ],
  "tier2-monthly": [
    "Conteúdos exclusivos e arquivo de extras",
    "Sugira um caso e acesso antecipado",
    "Crime Mania Juris",
  ],
  "tier1-yearly": [
    "Mesmos benefícios Tier 1 mensal",
    "Cobrança anual",
    "Dossiê, fórum e shop com benefício",
  ],
  "tier2-yearly": [
    "Mesmos direitos do Tier 2 mensal",
    "Preço de lançamento anual",
    "Conteúdos exclusivos, fórum e shop com benefício",
  ],
};
