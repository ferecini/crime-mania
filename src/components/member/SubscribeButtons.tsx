"use client";

import { useEffect, useRef, useState } from "react";
import { PLANS, PLAN_HIGHLIGHTS, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { WaitlistForm } from "@/components/member/WaitlistForm";
import { isValidCpfCnpj } from "@/lib/billing/cpf-cnpj";

export function SubscribeButtons({ checkoutEnabled = false }: { checkoutEnabled?: boolean }) {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "error" | "info"; message: string } | null>(
    null,
  );
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (feedback?.kind === "error") {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [feedback]);

  async function checkout(planId: PlanId) {
    if (checkoutEnabled && !isValidCpfCnpj(cpfCnpj)) {
      setFeedback({
        kind: "error",
        message: "Informe um CPF ou CNPJ válido no painel acima antes de assinar.",
      });
      return;
    }
    setLoading(planId);
    setFeedback(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          ...(checkoutEnabled && cpfCnpj.trim() ? { cpfCnpj: cpfCnpj.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string; mode?: string; checkoutUrl?: string };
      if (!res.ok) {
        setFeedback({
          kind: "error",
          message: data.error ?? "Não foi possível abrir o pagamento. Tente de novo em instantes.",
        });
        return;
      }
      if (data.mode === "hosted" && typeof data.checkoutUrl === "string") {
        const url = data.checkoutUrl.trim();
        if (url.startsWith("http")) {
          window.location.assign(url);
          return;
        }
      }
      if (data.mode === "simulated") {
        setFeedback({
          kind: "error",
          message:
            "Checkout simulado não está disponível com cobrança ativa. Entre em contato com o suporte.",
        });
        return;
      }
      setFeedback({
        kind: "error",
        message:
          data.error ??
          data.message ??
          "Não foi possível abrir o pagamento Asaas. Nenhuma cobrança foi iniciada — tente de novo em instantes.",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          ref={feedbackRef}
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={
            feedback.kind === "error"
              ? "rounded-lg border border-red-500/60 bg-red-950/40 px-4 py-3 text-sm leading-relaxed text-red-100"
              : "cm-panel px-4 py-3 text-sm text-cm-gray"
          }
        >
          {feedback.kind === "error" && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-300">
              Pagamento não iniciado
            </p>
          )}
          <p>{feedback.message}</p>
        </div>
      )}
      {checkoutEnabled && (
        <div className="cm-panel max-w-md space-y-3 p-4 text-sm">
          <h2 className="font-display text-lg text-white">CPF ou CNPJ</h2>
          <p className="text-xs leading-relaxed text-cm-gray">
            Informe uma vez antes de escolher o plano. Obrigatório para emitir a cobrança no Asaas;
            seus dados ficam apenas no provedor de pagamento.
          </p>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-cm-gray">
              Documento
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-cm-gray/60 focus:border-cm-red/50 focus:outline-none focus:ring-1 focus:ring-cm-red/40"
            />
          </label>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              {(PLAN_HIGHLIGHTS[plan.id] ?? []).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-cm-red-light">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {checkoutEnabled ? (
              <Button
                className="mt-5 w-full"
                variant={plan.highlight ? "primary" : "secondary"}
                disabled={loading !== null}
                onClick={() => checkout(plan.id)}
              >
                {loading === plan.id ? "Processando…" : "Assinar"}
              </Button>
            ) : (
              <WaitlistForm planId={plan.id} />
            )}
            <p className="mt-3 text-[11px] text-cm-gray">{plan.cancelPolicy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
