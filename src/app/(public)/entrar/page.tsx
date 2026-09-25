import { Suspense } from "react";
import { AuthForms } from "@/components/auth/AuthForms";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container">
        <h1 className="font-display text-center text-3xl text-white">Entrar ou criar conta</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-cm-gray">
          Cadastro não concede assinatura automaticamente. Após entrar, escolha um plano na área de
          membros.
        </p>
        <div className="mt-10">
          <Suspense fallback={<p className="text-center text-cm-gray">Carregando…</p>}>
            <AuthForms />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
