export interface ShopProduct {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  materials: string;
  care: string;
  sizes?: string;
  saleStatus: "prelaunch";
  listPriceLabel: string;
  imagePlaceholder: "mug" | "shirt";
  imageAlt: string;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    slug: "caneca-crime-mania",
    name: "Caneca Crime Mania",
    shortDescription: "Caneca cerâmica com logo editorial — preto, branco e vermelho.",
    description:
      "Caneca oficial para acompanhar episódios e dossiês. Acabamento fosco, logo Crime Mania em duas linhas e base estável para uso diário.",
    materials: "Cerâmica esmaltada · 325 ml",
    care: "Lavar à mão. Não utilizar micro-ondas se houver metálico na estampa (confirmar na versão final).",
    saleStatus: "prelaunch",
    listPriceLabel: "Pré-venda — preço em breve",
    imagePlaceholder: "mug",
    imageAlt: "Mockup editorial da caneca Crime Mania preta com logo",
  },
  {
    slug: "camiseta-crime-mania",
    name: "Camiseta Crime Mania",
    shortDescription: "Camiseta unissex algodão com logo central.",
    description:
      "Modelagem unissex, corte regular e estampa central Crime Mania. Pensada para uso casual com identidade investigativa da marca.",
    materials: "100% algodão penteado",
    sizes: "P · M · G · GG (confirmar grade final)",
    care: "Lavar do avesso em água fria. Secar à sombra.",
    saleStatus: "prelaunch",
    listPriceLabel: "Pré-venda — preço em breve",
    imagePlaceholder: "shirt",
    imageAlt: "Mockup editorial da camiseta preta Crime Mania",
  },
];

export function getProductBySlug(slug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.slug === slug);
}

export function memberDiscountLabel(tier: "none" | "tier1" | "tier2"): string | null {
  if (tier === "tier1" || tier === "tier2") {
    return "15% de desconto + prioridade no lançamento (aplicado no checkout quando ativo)";
  }
  return null;
}
