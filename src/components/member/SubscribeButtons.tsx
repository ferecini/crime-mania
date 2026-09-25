"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLANS, PLAN_HIGHLIGHTS, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { billingEnabled } from "@/lib/features";
import { WaitlistForm } from "@/components/member/WaitlistForm";

export function SubscribeButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function checkout(planId: PlanId) {
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
        setFeedback(data.error ?? "Não foi possível concluir.");
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
      <p className="text-sm leading-relaxed text-cm-gray">
        Assinaturas em fase de lançamento. Os valores finais serão publicados pela equipe Crime
        Mania. Enquanto isso, entre na lista de espera ou finalize a compra quando o checkout estiver
        ativo.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`cm-panel flex flex-col p-6 ${plan.highlight ? "ring-1 ring-cm-red/40" : ""}`}
          >
            {plan.highlight && (
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cm-red">
                Recomendado
              </p>
            )}
            <p className="font-display text-sm text-white">{plan.name}</p>
            <p className="mt-3 text-lg font-semibold text-white">{plan.priceLabel}</p>
            <p className="mt-2 text-xs leading-relaxed text-cm-gray">{plan.priceNote}</p>
            <p className="mt-3 text-xs text-cm-gray">{plan.billingDetail}</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-xs text-cm-gray">
              {PLAN_HIGHLIGHTS[plan.id].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-cm-red-light">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {billingEnabled ? (
              <Button
                className="mt-5 w-full"
                variant={plan.highlight ? "primary" : "secondary"}
                disabled={loading !== null}
                onClick={() => checkout(plan.id)}
              >
                {loading === plan.id ? "Processando…" : "Assinar agora"}
              </Button>
            ) : (
              <WaitlistForm planId={plan.id} />
            )}
            <p className="mt-3 text-[11px] text-cm-gray">{plan.cancelPolicy}</p>
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
