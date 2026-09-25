import Link from "next/link";
import { SHOP_PRODUCTS } from "@/data/products";

export const metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container">
        <p className="font-display text-sm text-cm-red">Merchandising</p>
        <h1 className="font-display mt-2 text-4xl text-white">Shop Crime Mania</h1>
        <p className="mt-4 max-w-2xl text-cm-gray">
          Compra disponível sem assinatura. Assinantes Tier 1 e Tier 2 recebem 15% de desconto e
          prioridade no lançamento — desconto aplicado após integração do checkout.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {SHOP_PRODUCTS.map((product) => (
            <Link
              key={product.slug}
              href={`/shop/${product.slug}`}
              className="rounded-sm border border-cm-gray-dark bg-cm-surface p-6 hover:border-cm-gray"
            >
              <h2 className="text-xl font-semibold text-white">{product.name}</h2>
              <p className="mt-2 text-sm text-cm-gray">{product.description}</p>
              <p className="mt-4 font-semibold">{product.priceLabel}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
