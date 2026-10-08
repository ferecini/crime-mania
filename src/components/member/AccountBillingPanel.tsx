"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { billingEnabled } from "@/lib/features";

type SubscriptionView = {
  planId: string;
  planName: string;
  billingCycle: string;
  status: string;
  priceLabel: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  nextDue: string | null;
};

type Props = {
  initial: {
    subscription: SubscriptionView | null;
    qa?: boolean;
    message?: string;
    billingEnabled: boolean;
    paymentMethodUpdate?: { message: string };
  };
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento",
  active: "Ativa",
  past_due: "Pagamento em atraso",
  canceled: "Cancelada (acesso até o fim do período)",
  expired: "Encerrada",
  refunded: "Reembolsada",
  chargeback: "Contestada",
};

export function AccountBillingPanel({ initial }: Props) {
  const [sub, setSub] = useState(initial.subscription);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (initial.qa) {
    return (
      <p className="text-sm text-cm-gray">
        {initial.message ?? "Conta de QA — sem cobrança real."}
      </p>
    );
  }

  async function cancelSubscription() {
    if (
      !window.confirm(
        "Cancelar assinatura? Você mantém acesso até o fim do período já pago. Não há reembolso automático.",
      )
    ) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? "Não foi possível cancelar.");
        return;
      }
      setFeedback(data.message ?? "Cancelamento agendado.");
      setSub((prev) => (prev ? { ...prev, cancelAtPeriodEnd: true } : prev));
    } finally {
      setLoading(false);
    }
  }

  if (!sub) {
    return (
      <div className="cm-panel space-y-2 p-4 text-sm text-cm-gray">
        <p>Nenhuma assinatura paga vinculada.</p>
        <p>
          {billingEnabled
            ? "Escolha um plano em Planos para iniciar o checkout."
            : "Checkout em modo seguro — lista de espera ativa até o lançamento oficial."}
        </p>
      </div>
    );
  }

  return (
    <div className="cm-panel space-y-4 p-4 text-sm">
      <h2 className="font-display text-lg text-white">Assinatura</h2>
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-cm-gray">Plano</dt>
          <dd className="text-white">{sub.planName}</dd>
        </div>
        <div>
          <dt className="text-cm-gray">Ciclo</dt>
          <dd className="text-white capitalize">
            {sub.billingCycle === "yearly" ? "Anual" : "Mensal"}
          </dd>
        </div>
        <div>
          <dt className="text-cm-gray">Valor</dt>
          <dd className="text-white">{sub.priceLabel ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-cm-gray">Status</dt>
          <dd className="text-white">{STATUS_LABEL[sub.status] ?? sub.status}</dd>
        </div>
        <div>
          <dt className="text-cm-gray">Próximo vencimento</dt>
          <dd className="text-white">{formatDate(sub.nextDue)}</dd>
        </div>
      </dl>
      {initial.paymentMethodUpdate?.message && (
        <p className="text-xs text-cm-gray">{initial.paymentMethodUpdate.message}</p>
      )}
      {sub.status === "active" && !sub.cancelAtPeriodEnd && billingEnabled && (
        <Button variant="secondary" disabled={loading} onClick={cancelSubscription}>
          {loading ? "Processando…" : "Cancelar assinatura"}
        </Button>
      )}
      {sub.cancelAtPeriodEnd && (
        <p className="text-xs text-cm-gray">
          Cancelamento agendado — acesso até {formatDate(sub.currentPeriodEnd)}.
        </p>
      )}
      {feedback && (
        <p className="text-xs text-cm-gray" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
