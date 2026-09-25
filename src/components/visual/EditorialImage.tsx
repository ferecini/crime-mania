import Image, { type ImageProps } from "next/image";

type EditorialImageProps = Omit<ImageProps, "alt"> & {
  alt: string;
};

/** Imagem responsiva com defaults editoriais; usar `sizes` explícito quando possível. */
export function EditorialImage({
  className = "",
  sizes = "100vw",
  alt,
  ...props
}: EditorialImageProps) {
  return (
    <Image
      alt={alt}
      className={`object-cover ${className}`}
      sizes={sizes}
      {...props}
    />
  );
}
