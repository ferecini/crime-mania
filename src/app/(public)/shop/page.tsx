import Link from "next/link";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SHOP_PRODUCTS } from "@/data/products";

export const metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container">
        <SectionHeader
          kicker="Merchandising"
          title="Shop Crime Mania"
          description="Pré-venda em preparação. Assinantes Tier 1 e 2 terão 15% de desconto e prioridade quando o checkout abrir."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {SHOP_PRODUCTS.map((product) => (
            <Link
              key={product.slug}
              href={`/shop/${product.slug}`}
              className="cm-panel group overflow-hidden transition hover:border-cm-red/30"
            >
              <ProductVisual type={product.imagePlaceholder} />
              <div className="p-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-cm-red">
                  Pré-venda
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white group-hover:text-cm-red-light">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-cm-gray">{product.shortDescription}</p>
                <p className="mt-4 font-semibold text-white">{product.listPriceLabel}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
