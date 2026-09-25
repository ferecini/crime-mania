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
  return {
    title: product?.name ?? "Produto",
    description: product?.shortDescription,
  };
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
            <p className="font-display text-xs tracking-[0.3em] text-cm-red">Pré-venda</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{product.name}</h1>
            <p className="mt-2 text-lg font-semibold text-white">{product.listPriceLabel}</p>
            <p className="mt-4 leading-relaxed text-cm-gray">{product.description}</p>
            <dl className="mt-6 grid gap-3 text-sm">
              <div>
                <dt className="text-cm-gray">Materiais</dt>
                <dd className="text-white">{product.materials}</dd>
              </div>
              {product.sizes && (
                <div>
                  <dt className="text-cm-gray">Tamanhos</dt>
                  <dd className="text-white">{product.sizes}</dd>
                </div>
              )}
              <div>
                <dt className="text-cm-gray">Cuidados</dt>
                <dd className="text-white">{product.care}</dd>
              </div>
              <div>
                <dt className="text-cm-gray">Trocas</dt>
                <dd className="text-white">
                  Política de troca será publicada junto com a abertura da loja.
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-cm-gray">
              Checkout indisponível no momento. Entre na sua conta para ser avisado quando a compra
              abrir; assinantes recebem desconto automático quando previsto.
            </p>
            <ButtonLink href="/entrar" className="mt-6">
              Entrar para avisos de lançamento
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
