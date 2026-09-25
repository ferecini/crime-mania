"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { googleAuthEnabled } from "@/lib/features";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_indisponivel: "Entrada com Google não está configurada no servidor.",
  google_cancelado: "Entrada com Google cancelada.",
  google_estado_invalido: "Sessão Google expirada. Tente novamente.",
  google_demo: "Conta demo não pode usar Google em produção.",
  google_falhou: "Não foi possível concluir a entrada com Google. Tente de novo.",
  access_denied: "Permissão negada no Google.",
};

export function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/membro";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(GOOGLE_ERROR_MESSAGES[oauthError] ?? "Erro ao entrar com Google.");
    }
  }, [searchParams]);

  async function submitEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      displayName: String(fd.get("displayName") ?? ""),
    };
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email: payload.email, password: payload.password }
        : payload;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível continuar.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Serviço indisponível. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function googleLogin() {
    setError(null);
    const url = `/api/auth/google?next=${encodeURIComponent(next)}`;
    window.location.href = url;
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="cm-panel p-6 md:p-8">
        <div className="mb-6 flex rounded-[4px] border border-cm-divider bg-black/30 p-1">
          <button
            type="button"
            className={`flex-1 rounded-[4px] py-2.5 text-sm font-semibold transition ${mode === "login" ? "bg-cm-red text-white" : "text-cm-gray hover:text-white"}`}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`flex-1 rounded-[4px] py-2.5 text-sm font-semibold transition ${mode === "register" ? "bg-cm-red text-white" : "text-cm-gray hover:text-white"}`}
            onClick={() => setMode("register")}
          >
            Criar conta
          </button>
        </div>

        {googleAuthEnabled && (
          <button
            type="button"
            onClick={googleLogin}
            disabled={loading}
            className="mb-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-[4px] border border-cm-divider bg-cm-bg-elevated px-4 py-3 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            <span aria-hidden className="text-base">
              G
            </span>
            Continuar com Google
          </button>
        )}

        {googleAuthEnabled && (
          <p className="-mt-4 mb-6 text-center text-[11px] text-cm-gray">
            Usamos apenas e-mail e nome do perfil Google para criar ou acessar sua conta.
          </p>
        )}

        <form onSubmit={submitEmail} className="space-y-4">
          {mode === "register" && (
            <label className="block text-sm">
              <span className="mb-1.5 block text-cm-gray">Nome de exibição</span>
              <input
                name="displayName"
                required
                minLength={2}
                className="cm-input"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1.5 block text-cm-gray">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="cm-input"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-cm-gray">Senha</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="cm-input"
            />
          </label>
          {error && (
            <p className="text-sm text-cm-red-light" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Cadastrar"}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-cm-gray">
        Criar conta é gratuito e libera a área de membros. Episódios públicos continuam abertos.
        Dossiês, Arquivo e conteúdo premium exigem assinatura — escolha um plano depois de entrar.
      </p>
    </div>
  );
}
