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
      className="cm-panel group relative block overflow-hidden p-5 transition hover:border-cm-red/35 md:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(144,2,0,0.12),transparent_55%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cm-red">{planHint}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white group-hover:text-cm-red-light">{title}</h3>
          <span className="text-cm-gray" aria-hidden title="Bloqueado">
            🔒
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-cm-gray">{description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/70 group-hover:text-white">
          Ver como desbloquear →
        </p>
      </div>
    </Link>
  );
}
