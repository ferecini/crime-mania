"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

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

  async function googleDevLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "google.user@crimemania.com.br",
          displayName: "Conta Google (demo)",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha no login Google.");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="flex rounded-sm border border-cm-gray-dark p-1">
        <button
          type="button"
          className={`flex-1 rounded-sm py-2 text-sm font-semibold ${mode === "login" ? "bg-cm-red text-white" : "text-cm-gray"}`}
          onClick={() => setMode("login")}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`flex-1 rounded-sm py-2 text-sm font-semibold ${mode === "register" ? "bg-cm-red text-white" : "text-cm-gray"}`}
          onClick={() => setMode("register")}
        >
          Criar conta
        </button>
      </div>

      <button
        type="button"
        onClick={googleDevLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-cm-gray-dark bg-cm-surface px-4 py-3 text-sm font-medium text-white hover:border-cm-gray disabled:opacity-50"
      >
        Continuar com Google
      </button>
      <p className="text-center text-xs text-cm-gray">
        OAuth Google real será conectado antes do go-live. Este botão cria uma sessão demo.
      </p>

      <form onSubmit={submitEmail} className="space-y-4">
        {mode === "register" && (
          <label className="block text-sm">
            <span className="mb-1 block text-cm-gray">Nome de exibição</span>
            <input
              name="displayName"
              required
              minLength={2}
              className="w-full rounded-sm border border-cm-gray-dark bg-cm-bg px-3 py-2.5 text-white outline-none focus:border-cm-red"
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1 block text-cm-gray">E-mail</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-sm border border-cm-gray-dark bg-cm-bg px-3 py-2.5 text-white outline-none focus:border-cm-red"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-cm-gray">Senha</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-sm border border-cm-gray-dark bg-cm-bg px-3 py-2.5 text-white outline-none focus:border-cm-red"
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

      <p className="text-xs leading-relaxed text-cm-gray">
        Demo local: <strong className="text-white">demo@crimemania.com.br</strong> /{" "}
        <strong className="text-white">maniaco123</strong>
      </p>
    </div>
  );
}
