import Link from "next/link";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { getSession } from "@/lib/auth/session";
import { tierHasFeature } from "@/lib/plans";
import { SHOP_PRODUCTS, memberDiscountLabel } from "@/data/products";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { memberSectionArtwork } from "@/lib/visual/category-artwork";

export const metadata = { title: "Shop · Membros" };

export default async function MemberShopPage() {
  const session = await getSession();
  const tier = session?.tier ?? "none";
  const discount = memberDiscountLabel(tier);

  return (
    <div className="space-y-6">
      <MemberSectionHeader
        title="Shop para membros"
        description="Merchandising oficial — pré-venda com benefícios para assinantes."
        imageSrc={memberSectionArtwork.shop}
      />
      {discount ? (
        <p className="cm-panel border-cm-red/30 bg-cm-red/5 p-4 text-sm text-white">{discount}</p>
      ) : (
        <p className="text-sm text-cm-gray">
          Assinantes Tier 1 e Tier 2 terão desconto e prioridade quando a loja abrir.{" "}
          <Link href="/membro/planos" className="text-cm-red hover:underline">
            Ver planos
          </Link>
        </p>
      )}
      <p className="text-sm text-cm-gray">
        Pré-venda — checkout será habilitado em breve. Nenhuma cobrança é feita nesta versão.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {SHOP_PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            href={`/shop/${p.slug}`}
            className="cm-panel overflow-hidden transition hover:border-cm-gray"
          >
            <ProductVisual type={p.imagePlaceholder} />
            <div className="p-5">
              <h2 className="font-semibold text-white">{p.name}</h2>
              <p className="mt-2 text-sm text-cm-gray">{p.shortDescription}</p>
              <p className="mt-3 text-sm font-semibold text-white">{p.listPriceLabel}</p>
              {tierHasFeature(tier, "shopDiscount") && (
                <p className="mt-2 text-xs text-cm-red-light">Desconto de assinante aplicado no checkout</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
