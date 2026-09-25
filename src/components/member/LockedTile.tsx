import Link from "next/link";

export function LockedTile({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-sm border border-cm-gray-dark bg-cm-surface p-5 transition hover:border-cm-gray"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-white group-hover:text-cm-red-light">{title}</h3>
        <span className="text-cm-gray" aria-hidden title="Conteúdo bloqueado">
          🔒
        </span>
      </div>
      <p className="text-sm text-cm-gray">{description}</p>
    </Link>
  );
}
