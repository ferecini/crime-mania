import type { Metadata } from "next";
import { PlansPageContent } from "@/components/member/PlansPageContent";
import { getSession } from "@/lib/auth/session";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Planos",
  description:
    "Assinaturas Crime Mania Tier 1 e Tier 2: episódios, dossiês, fórum e conteúdo exclusivo de true crime. Planos mensais e anuais.",
  path: "/planos",
});

export default async function PublicPlansPage() {
  const session = await getSession();
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container">
        <PlansPageContent session={session} />
      </div>
    </div>
  );
}
