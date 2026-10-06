export function MemberSectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="rounded-[4px] border border-cm-divider bg-cm-bg-low px-6 py-8 md:px-8 md:py-10">
      <h1 className="font-display text-2xl text-white md:text-3xl">{title}</h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cm-gray md:text-base">
          {description}
        </p>
      )}
    </header>
  );
}
