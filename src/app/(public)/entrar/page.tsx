import { Suspense } from "react";
import { AuthForms } from "@/components/auth/AuthForms";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="cm-block min-h-0 cm-hero-bg py-24">
      <div className="cm-container max-w-lg">
        <SectionHeader
          align="center"
          kicker="Conta"
          title="Entrar ou criar conta"
          description="Acesse dossiês, comunidade e conteúdos exclusivos. Escolha seu plano depois de entrar."
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
