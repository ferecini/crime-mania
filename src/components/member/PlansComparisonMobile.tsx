import { FEATURE_MATRIX, PLANS, PLAN_HIGHLIGHTS, type FeatureKey, type PlanId } from "@/lib/plans";

function tierColumn(planId: PlanId): "registered" | "tier1" | "tier2" {
  if (planId.startsWith("tier2")) return "tier2";
  return "tier1";
}

export function PlansComparisonMobile() {
  const features = Object.keys(FEATURE_MATRIX) as FeatureKey[];

  return (
    <div className="space-y-4 lg:hidden">
      {PLANS.map((plan) => {
        const col = tierColumn(plan.id);
        return (
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
                {PLAN_HIGHLIGHTS[plan.id].map((h) => (
                  <li key={h}>✓ {h}</li>
                ))}
              </ul>
              <ul className="space-y-2 text-sm">
                {features.map((key) => {
                  const row = FEATURE_MATRIX[key];
                  const included =
                    col === "tier2" ? row.tier2 : col === "tier1" ? row.tier1 : row.registered;
                  return (
                    <li key={key} className="flex justify-between gap-3 border-b border-white/5 py-2">
                      <span className="text-cm-gray">{row.label}</span>
                      <span className={included ? "text-cm-red-light" : "text-cm-gray-dark"}>
                        {included ? "Incluído" : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        );
      })}
    </div>
  );
}
