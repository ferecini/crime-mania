import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForms } from "@/components/auth/AuthForms";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getSession } from "@/lib/auth/session";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Entrar",
  description: "Acesso de membros Crime Mania.",
  path: "/entrar",
  noIndex: true,
});

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/membro");
  return (
    <div className="cm-block min-h-0 cm-hero-bg py-24">
      <div className="cm-container max-w-lg">
        <SectionHeader
          align="center"
          kicker="Conta"
          title="Entrar ou criar conta"
          description="Acesse nossos conteúdos exclusivos, comunidade e mais informações sobre o universo do true crime."
        />
        <div className="mt-10">
          <Suspense fallback={<p className="text-center text-cm-gray">Carregando…</p>}>
            <AuthForms />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
