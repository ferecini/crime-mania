"use client";

import { ButtonLink } from "@/components/ui/Button";

export default function PlanosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container max-w-lg space-y-4 text-center">
        <h1 className="font-display text-2xl text-white">Planos temporariamente indisponíveis</h1>
        <p className="text-sm leading-relaxed text-cm-gray">
          Não foi possível carregar a página de planos. Tente novamente em instantes ou entre em
          contato com a equipe Crime Mania.
        </p>
        {error.digest && (
          <p className="text-xs text-cm-gray-dark">Referência: {error.digest}</p>
        )}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="cm-text-link min-h-11 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
          <ButtonLink href="/" variant="secondary" className="min-h-11">
            Voltar ao início
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
