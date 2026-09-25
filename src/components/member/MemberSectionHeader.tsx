import Image from "next/image";

export function MemberSectionHeader({
  title,
  description,
  imageSrc,
}: {
  title: string;
  description?: string;
  imageSrc: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-[4px] bg-cm-bg-low">
      <div className="relative min-h-[140px] md:min-h-[168px]">
        <Image src={imageSrc} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 960px" priority={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" aria-hidden />
        <div className="relative flex min-h-[140px] flex-col justify-end p-6 md:min-h-[168px] md:p-8">
          <h1 className="font-display text-2xl text-white md:text-3xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cm-gray md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
