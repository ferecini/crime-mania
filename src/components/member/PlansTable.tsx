import { FEATURE_MATRIX, PLANS, type FeatureKey } from "@/lib/plans";

const columns = [
  { key: "guest", label: "Visitante" },
  { key: "registered", label: "Cadastro" },
  { key: "tier1", label: "Tier 1" },
  { key: "tier2", label: "Tier 2" },
] as const;

function cell(value: boolean) {
  return value ? (
    <span className="text-white" aria-label="Incluído">
      ✓
    </span>
  ) : (
    <span className="text-cm-gray-dark" aria-label="Não incluído">
      —
    </span>
  );
}

export function PlansTable() {
  const features = Object.keys(FEATURE_MATRIX) as FeatureKey[];
  return (
    <div className="overflow-x-auto rounded-sm border border-cm-gray-dark">
      <table className="min-w-[640px] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-cm-gray-dark bg-cm-surface-elevated">
            <th className="p-3 font-medium text-cm-gray">Benefício</th>
            {columns.map((col) => (
              <th key={col.key} className="p-3 font-medium text-white">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((key) => {
            const row = FEATURE_MATRIX[key];
            return (
              <tr key={key} className="border-b border-cm-gray-dark/60">
                <td className="p-3 text-cm-gray">{row.label}</td>
                <td className="p-3">{cell(row.guest)}</td>
                <td className="p-3">{cell(row.registered)}</td>
                <td className="p-3">{cell(row.tier1)}</td>
                <td className="p-3">{cell(row.tier2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-cm-gray-dark bg-cm-surface p-3 text-xs text-cm-gray">
        Planos comerciais: {PLANS.map((p) => p.name).join(" · ")} — valores finais a confirmar
        com a equipe.
      </p>
    </div>
  );
}
