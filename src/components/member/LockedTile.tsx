import Link from "next/link";

export function LockedTile({
  title,
  description,
  href,
  planHint = "Assinatura necessária",
}: {
  title: string;
  description: string;
  href: string;
  planHint?: string;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[4px] border border-cm-divider bg-cm-bg-low transition hover:bg-cm-bg-elevated"
    >
      <div className="flex items-center justify-between border-b border-cm-divider bg-cm-bg-elevated px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cm-red">{planHint}</p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full border border-cm-divider bg-black/40 text-xs text-white"
          aria-label="Conteúdo bloqueado"
          title="Bloqueado"
        >
          🔒
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-cm-red-light">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-cm-gray">{description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/70 group-hover:text-white">
          Ver como desbloquear →
        </p>
      </div>
    </Link>
  );
}
