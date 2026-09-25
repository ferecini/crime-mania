interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  kicker,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <header className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      {kicker && (
        <p className="font-display text-xs tracking-[0.35em] text-cm-red md:text-sm">
          {kicker}
        </p>
      )}
      <h2
        className={`font-display mt-3 text-3xl leading-tight text-white md:text-4xl lg:text-5xl ${centered ? "" : ""}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base leading-relaxed text-cm-gray md:text-lg ${centered ? "mx-auto" : ""}`}>
          {description}
        </p>
      )}
    </header>
  );
}
