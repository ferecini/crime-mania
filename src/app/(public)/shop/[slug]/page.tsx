import { notFound } from "next/navigation";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { ButtonLink } from "@/components/ui/Button";
import { getProductBySlug } from "@/data/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return { title: product?.name ?? "Produto" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container max-w-3xl">
        <div className="cm-panel overflow-hidden">
          <ProductVisual type={product.imagePlaceholder} />
          <div className="p-6 md:p-8">
            <p className="font-display text-xs tracking-[0.3em] text-cm-gray">Shop</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{product.name}</h1>
            <p className="mt-4 leading-relaxed text-cm-gray">{product.description}</p>
            <p className="mt-6 text-xl font-semibold text-white">{product.priceLabel}</p>
            <ButtonLink href="/entrar" className="mt-8">
              Entrar para comprar
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
