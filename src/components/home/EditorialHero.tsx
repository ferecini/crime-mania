import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { heroArtwork } from "@/lib/visual/category-artwork";
import { EditorialImage } from "@/components/visual/EditorialImage";

export function EditorialHero() {
  return (
    <section id="top" className="relative min-h-[78svh] max-h-[88svh] overflow-hidden bg-cm-bg">
      <div className="absolute inset-0 md:hidden">
        <EditorialImage
          src={heroArtwork.mobile}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 hidden md:block">
        <EditorialImage
          src={heroArtwork.desktop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center]"
        />
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent md:from-black md:via-black/55 md:to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent"
        aria-hidden
      />

      <div className="cm-container relative flex min-h-[78svh] max-h-[88svh] flex-col justify-end pb-10 pt-28 md:justify-center md:pb-16 md:pt-32">
        <div className="max-w-xl md:max-w-lg lg:max-w-xl">
          <p className="font-display text-xs tracking-[0.4em] text-cm-red md:text-sm">
            True crime editorial
          </p>
          <h1 className="font-display mt-5 max-w-[12ch] text-[2rem] leading-[1.05] text-white sm:text-5xl lg:text-[3.25rem]">
            Oi, Crime Maníacos…
          </h1>
          <p className="mt-5 text-lg text-white/90 md:text-xl">
            Vamos seguir falando sobre true crime?
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-cm-gray md:text-lg">
            Quer conteúdos exclusivos, acesso aos nossos debates e mais informações sobre o
            universo do true crime?
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/membro/planos">Faça parte</ButtonLink>
            <Link
              href="/entrar"
              className="cm-text-link inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-white"
            >
              Entrar
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
