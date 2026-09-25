import Image from "next/image";
import Link from "next/link";

export function LockedTile({
  title,
  description,
  href,
  planHint = "Assinatura necessária",
  imageSrc,
}: {
  title: string;
  description: string;
  href: string;
  planHint?: string;
  imageSrc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[4px] bg-cm-bg-low transition hover:bg-cm-bg-elevated"
    >
      <div className="relative h-32">
        <Image src={imageSrc} alt="" fill className="object-cover" sizes="320px" />
        <div className="absolute inset-0 bg-black/55" aria-hidden />
        <span
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-cm-divider bg-black/40 text-xs text-white"
          aria-label="Conteúdo bloqueado"
          title="Bloqueado"
        >
          🔒
        </span>
      </div>
      <div className="border-t border-cm-divider p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cm-red">{planHint}</p>
        <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-cm-red-light">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-cm-gray">{description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/70 group-hover:text-white">
          Ver como desbloquear →
        </p>
      </div>
    </Link>
  );
}
