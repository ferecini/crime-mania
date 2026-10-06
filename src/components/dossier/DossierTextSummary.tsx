import type { DossierRecord } from "@/data/dossiers";

export function DossierTextSummary({ dossier }: { dossier: DossierRecord }) {
  const { textContent } = dossier;
  if (!textContent.victims && !textContent.locationDate && !textContent.theories) {
    return null;
  }

  return (
    <section className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6" aria-label="Resumo acessível">
      <h2 className="font-display text-lg text-white">Resumo acessível do caso</h2>
      <dl className="mt-4 space-y-4 text-sm text-cm-gray">
        {textContent.victims && (
          <div>
            <dt className="font-semibold text-white">Vítimas</dt>
            <dd className="mt-1">{textContent.victims}</dd>
          </div>
        )}
        {textContent.locationDate && (
          <div>
            <dt className="font-semibold text-white">Local e data</dt>
            <dd className="mt-1">{textContent.locationDate}</dd>
          </div>
        )}
        {textContent.timeline && textContent.timeline.length > 0 && (
          <div>
            <dt className="font-semibold text-white">Linha do tempo</dt>
            <dd className="mt-1">
              <ul className="list-disc space-y-1 pl-5">
                {textContent.timeline.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {textContent.theories && (
          <div>
            <dt className="font-semibold text-white">Teorias e versões</dt>
            <dd className="mt-1">{textContent.theories}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
