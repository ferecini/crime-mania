import { ButtonLink } from "@/components/ui/Button";
import { EditorialImage } from "@/components/visual/EditorialImage";
import { aboutPlaceholder } from "@/lib/visual/category-artwork";

export function EditorialHero() {
  return (
    <section id="top" className="relative bg-cm-bg pt-[4.75rem] md:pt-[5.25rem]">
      <div className="cm-container grid min-h-[calc(100svh-4.75rem)] max-w-[77.5rem] gap-10 py-10 md:min-h-[calc(100svh-5.25rem)] md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
        <div className="flex flex-col justify-center order-1">
          <h1 className="font-display text-[2rem] leading-[1.05] text-white sm:text-5xl lg:text-[3.25rem]">
            Oi, Crime Maníacos…
          </h1>
          <p className="mt-5 text-lg font-semibold text-white/95 md:text-xl">
            Vamos seguir conversando sobre true crime?
          </p>
          <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-cm-gray md:text-lg">
            Aqui a conversa continua. Acesse nossos conteúdos exclusivos, comunidade e mais
            informações sobre o universo do true crime.
          </p>
          <div className="mt-8">
            <ButtonLink href="/planos" className="min-h-11">
              Faça parte
            </ButtonLink>
          </div>
        </div>

        <div className="relative order-2 mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[4px] lg:mx-0 lg:max-w-none lg:justify-self-end">
          <EditorialImage
            src={aboutPlaceholder}
            alt="Foto provisória de estúdio — retrato oficial da Rafa em breve"
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 480px"
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
        </div>
      </div>
    </section>
  );
}
