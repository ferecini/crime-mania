import { shopProductArtwork } from "@/lib/visual/category-artwork";
import { EditorialImage } from "@/components/visual/EditorialImage";

export function ProductVisual({ type }: { type: "mug" | "shirt" }) {
  const src = type === "mug" ? shopProductArtwork.mug : shopProductArtwork.shirt;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
      <EditorialImage
        src={src}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 560px"
        className="object-cover object-center"
      />
    </div>
  );
}
