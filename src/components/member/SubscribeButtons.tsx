"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/Button";

export function SubscribeButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function choose(planId: PlanId) {
    setLoading(planId);
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Não foi possível simular o pagamento.");
        return;
      }
      setMessage(data.message);
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
            className={`rounded-sm border p-5 ${plan.highlight ? "border-cm-red bg-cm-red/5" : "border-cm-gray-dark bg-cm-surface"}`}
          >
            <p className="font-display text-sm text-white">{plan.name}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{plan.priceLabel}</p>
            <p className="mt-1 text-xs text-cm-gray">{plan.priceNote}</p>
            <Button
              className="mt-4 w-full"
              variant={plan.highlight ? "primary" : "secondary"}
              disabled={loading !== null}
              onClick={() => choose(plan.id)}
            >
              {loading === plan.id ? "Processando…" : "Assinar (simulação)"}
            </Button>
          </div>
        ))}
      </div>
      {message && (
        <p className="text-sm text-cm-gray" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
