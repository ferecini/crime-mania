"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/Button";

export function WaitlistForm({ planId }: { planId: PlanId }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Não foi possível registrar.");
        return;
      }
      setStatus("done");
      setMessage("Você entrou na lista de espera. Avisaremos quando a assinatura abrir.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Serviço indisponível. Tente novamente.");
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-xs text-cm-gray">
        E-mail para aviso de lançamento
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="cm-input mt-1"
          placeholder="seu@email.com"
        />
      </label>
      <Button type="submit" disabled={status === "loading" || status === "done"} className="w-full">
        {status === "loading" ? "Enviando…" : "Entrar na lista de espera"}
      </Button>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-cm-red-light" : "text-cm-gray"}`} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
