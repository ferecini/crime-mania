"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PreferredNameForm({
  initialValue = "",
  nextPath = "/membro",
  submitLabel = "Salvar",
}: {
  initialValue?: string;
  nextPath?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Serviço indisponível. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block text-cm-gray">Como você gostaria de ser chamado?</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          minLength={1}
          maxLength={80}
          autoComplete="nickname"
          className="cm-input"
        />
      </label>
      {error && (
        <p className="text-sm text-cm-red-light" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Aguarde…" : submitLabel}
      </Button>
    </form>
  );
}
