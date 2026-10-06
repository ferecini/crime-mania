"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function AccountPreferredNameForm({
  initialPreferredName,
  needsConfirm,
}: {
  initialPreferredName: string;
  needsConfirm?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialPreferredName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredName: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      setMessage("Nome de exibição atualizado.");
      router.refresh();
    } catch {
      setError("Serviço indisponível.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-cm-gray-dark p-4">
      <label className="block text-sm">
        <span className="mb-1.5 block text-cm-gray">Como você gostaria de ser chamado?</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          minLength={1}
          maxLength={80}
          className="cm-input"
        />
      </label>
      {needsConfirm && (
        <p className="text-xs text-cm-gray">
          Confirmamos o primeiro nome do seu perfil — ajuste se preferir outra forma de ser chamado.
        </p>
      )}
      {error && (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      <Button type="submit" disabled={loading} variant="secondary">
        {loading ? "Salvando…" : "Atualizar nome"}
      </Button>
    </form>
  );
}
