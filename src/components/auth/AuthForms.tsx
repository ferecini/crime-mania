"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { googleAuthEnabled } from "@/lib/features";

export function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/membro";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function googleLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar com Google.");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="cm-panel p-6 md:p-8">
        <div className="mb-6 flex rounded-md border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition ${mode === "login" ? "bg-cm-red text-white" : "text-cm-gray hover:text-white"}`}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition ${mode === "register" ? "bg-cm-red text-white" : "text-cm-gray hover:text-white"}`}
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
            className="mb-6 flex w-full min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
          >
            Continuar com Google
          </button>
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
        Cadastro não inclui assinatura automaticamente. Escolha um plano após entrar.
      </p>
    </div>
  );
}
