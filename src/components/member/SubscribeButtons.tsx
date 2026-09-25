"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { billingEnabled } from "@/lib/features";

export function SubscribeButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function choose(planId: PlanId) {
    if (!billingEnabled) {
      setFeedback(
        "Assinaturas online em breve. Enquanto isso, entre em contato pelo Instagram @crimemania.",
      );
      return;
    }

    setLoading(planId);
    setFeedback(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? "Não foi possível concluir a assinatura.");
        return;
      }
      setFeedback("Plano atualizado com sucesso.");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`cm-panel p-6 ${plan.highlight ? "ring-1 ring-cm-red/40" : ""}`}
          >
            <p className="font-display text-sm text-white">{plan.name}</p>
            <p className="mt-3 text-lg font-semibold text-white">{plan.priceLabel}</p>
            <p className="mt-2 text-xs leading-relaxed text-cm-gray">{plan.priceNote}</p>
            <Button
              className="mt-5 w-full"
              variant={plan.highlight ? "primary" : "secondary"}
              disabled={loading !== null}
              onClick={() => choose(plan.id)}
            >
              {loading === plan.id ? "Processando…" : "Quero este plano"}
            </Button>
          </div>
        ))}
      </div>
      {feedback && (
        <p className="text-sm text-cm-gray" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
