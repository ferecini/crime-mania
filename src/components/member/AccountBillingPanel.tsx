"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

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
    qaTestEnabled?: boolean;
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
      <QaBillingTest enabled={Boolean(initial.qaTestEnabled)} message={initial.message} />
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
          {initial.billingEnabled
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
      {sub.status === "active" && !sub.cancelAtPeriodEnd && initial.billingEnabled && (
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

const QA_PLANS = [
  ["tier1-monthly", "Tier 1 mensal — R$ 9"],
  ["tier2-monthly", "Tier 2 mensal — R$ 29"],
  ["tier1-yearly", "Tier 1 anual — R$ 99"],
  ["tier2-yearly", "Tier 2 anual — R$ 159"],
] as const;

function QaBillingTest({ enabled, message }: { enabled: boolean; message?: string }) {
  const [planId, setPlanId] = useState<string>("tier1-monthly");
  const [result, setResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/billing/qa-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      setResult(res.ok ? `${data.message} Plano: ${data.priceLabel}.` : data.error);
    } catch {
      setResult("Não foi possível concluir o teste.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="cm-panel space-y-4 p-4 text-sm">
      <div>
        <h2 className="font-display text-lg text-white">Teste seguro de pagamento</h2>
        <p className="mt-1 text-cm-gray">
          {message ?? "Conta de QA — sem cobrança real."}
        </p>
      </div>
      {enabled ? (
        <>
          <label className="block space-y-2 text-cm-gray">
            <span>Plano para simular</span>
            <select
              className="min-h-12 w-full rounded border border-cm-divider bg-black px-3 text-white"
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
            >
              {QA_PLANS.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>
          <Button onClick={runTest} disabled={testing}>
            {testing ? "Testando…" : "Simular pagamento aprovado"}
          </Button>
          <p className="text-xs text-cm-gray">
            Não chama o Asaas, não cobra e não altera o tier da conta.
          </p>
        </>
      ) : (
        <p className="text-xs text-cm-gray">Simulação desativada neste ambiente.</p>
      )}
      {result && <p role="status" className="text-sm text-white">{result}</p>}
    </div>
  );
}
