export interface ShopProduct {
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  imagePlaceholder: "mug" | "shirt";
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    slug: "caneca-crime-mania",
    name: "Caneca Crime Mania",
    description:
      "Caneca oficial para acompanhar investigações com café — identidade editorial em preto, branco e vermelho.",
    priceLabel: "Em breve",
    imagePlaceholder: "mug",
  },
  {
    slug: "camiseta-crime-mania",
    name: "Camiseta Crime Mania",
    description:
      "Camiseta unissex com logo Crime Mania. Assinantes Tier 1 e 2 têm 15% de desconto e prioridade no lançamento.",
    priceLabel: "Em breve",
    imagePlaceholder: "shirt",
  },
];

export function getProductBySlug(slug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.slug === slug);
}
