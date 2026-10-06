import { PLAN_COMPARISON_COLUMNS, PLAN_COMPARISON_ROWS, PLANS } from "@/lib/plans";

function cell(value: boolean) {
  return value ? (
    <span className="text-cm-red-light" aria-label="Incluído">
      Sim
    </span>
  ) : (
    <span className="text-cm-gray-dark" aria-label="Não incluído">
      —
    </span>
  );
}

export function PlansTable() {
  return (
    <div className="cm-panel hidden lg:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-black/20">
            <th className="p-4 font-medium text-cm-gray">Benefício</th>
            {PLAN_COMPARISON_COLUMNS.map((col) => (
              <th key={col.key} className="p-4 font-medium text-white">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLAN_COMPARISON_ROWS.map((row) => (
            <tr key={row.label} className="border-b border-white/5">
              <td className="p-4 text-cm-gray">{row.label}</td>
              <td className="p-4">{cell(row.tier1)}</td>
              <td className="p-4">{cell(row.tier2)}</td>
              <td className="p-4">{cell(row.tier2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-white/10 p-4 text-xs leading-relaxed text-cm-gray">
        Planos: {PLANS.map((p) => p.name).join(" · ")}. Valores comerciais serão anunciados no
        lançamento oficial.
      </p>
    </div>
  );
}
