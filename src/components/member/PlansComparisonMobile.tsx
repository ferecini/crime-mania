import { PLAN_COMPARISON_ROWS, PLANS, PLAN_HIGHLIGHTS, type PlanId } from "@/lib/plans";

function planIncludes(planId: PlanId, row: (typeof PLAN_COMPARISON_ROWS)[number]): boolean {
  const isTier1 = planId === "tier1-monthly";
  return isTier1 ? row.tier1 : row.tier2;
}

export function PlansComparisonMobile() {
  return (
    <div className="space-y-4 lg:hidden">
      {PLANS.map((plan) => (
        <details key={plan.id} className="cm-panel group p-0" open={plan.highlight}>
          <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                {plan.highlight && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cm-red">
                    Recomendado
                  </p>
                )}
                <p className="font-display text-sm text-white">{plan.name}</p>
                <p className="mt-1 text-sm text-cm-gray">{plan.priceLabel}</p>
              </div>
              <span className="text-cm-gray transition group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </div>
            {plan.recommendedReason && (
              <p className="mt-2 text-xs text-cm-gray">{plan.recommendedReason}</p>
            )}
          </summary>
          <div className="border-t border-white/5 px-5 pb-5 pt-3">
            <ul className="mb-4 space-y-1 text-xs text-cm-gray">
              {(PLAN_HIGHLIGHTS[plan.id] ?? []).map((h) => (
                <li key={h}>✓ {h}</li>
              ))}
            </ul>
            <ul className="space-y-2 text-sm">
              {PLAN_COMPARISON_ROWS.map((row) => {
                const included = planIncludes(plan.id, row);
                return (
                  <li key={row.label} className="flex justify-between gap-3 border-b border-white/5 py-2">
                    <span className="min-w-0 flex-1 text-cm-gray">{row.label}</span>
                    <span className={included ? "shrink-0 text-cm-red-light" : "shrink-0 text-cm-gray-dark"}>
                      {included ? "Sim" : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}
