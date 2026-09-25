import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { tierHasFeature } from "@/lib/plans";
import { SHOP_PRODUCTS } from "@/data/products";

export const metadata = { title: "Shop · Membros" };

export default async function MemberShopPage() {
  const session = await getSession();
  const discount = tierHasFeature(session?.tier ?? "none", "shopDiscount");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-white">Shop para membros</h1>
      {discount ? (
        <p className="rounded-sm border border-cm-red/40 bg-cm-red/5 p-4 text-sm text-white">
          Seu plano inclui <strong>15% de desconto</strong> e prioridade no lançamento (aplicação
          automática após integração do checkout).
        </p>
      ) : (
        <p className="text-sm text-cm-gray">
          Assinantes Tier 1 e Tier 2 têm desconto e prioridade.{" "}
          <Link href="/membro/planos" className="text-cm-red hover:underline">
            Ver planos
          </Link>
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {SHOP_PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            href={`/shop/${p.slug}`}
            className="rounded-sm border border-cm-gray-dark p-5 hover:border-cm-gray"
          >
            <h2 className="font-semibold text-white">{p.name}</h2>
            <p className="mt-2 text-sm text-cm-gray">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
