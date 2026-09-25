import { notFound } from "next/navigation";
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
      <div className="cm-container max-w-2xl">
        <p className="text-sm text-cm-gray">Shop</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{product.name}</h1>
        <p className="mt-4 leading-relaxed text-cm-gray">{product.description}</p>
        <p className="mt-6 text-xl font-semibold text-white">{product.priceLabel}</p>
        <p className="mt-4 text-sm text-cm-gray">
          Checkout e estoque serão conectados ao provedor de pagamentos escolhido pela equipe.
        </p>
        <ButtonLink href="/entrar" className="mt-8">
          Entrar para comprar
        </ButtonLink>
      </div>
    </div>
  );
}
