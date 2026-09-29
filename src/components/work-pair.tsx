import Image from "next/image";
import { cn } from "@/lib/utils";
import type { WorkDTO } from "@/lib/types";

type Props = {
  work: WorkDTO;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

/** Las dos imágenes del trabajo lado a lado, completas (sin recortar). */
export function WorkPair({ work, sizes = "(min-width: 1024px) 18vw, (min-width: 640px) 25vw, 50vw", className, priority }: Props) {
  return (
    <div className={cn("grid grid-cols-2 gap-1.5", className)}>
      <PairImage src={work.expectationUrl} alt={`Expectativa de ${work.studentName}`} label="Expectativa" tone="expectation" sizes={sizes} priority={priority} />
      <PairImage src={work.realityUrl} alt={`Realidad de ${work.studentName}`} label="Realidad" tone="reality" sizes={sizes} priority={priority} />
    </div>
  );
}

function PairImage({
  src,
  alt,
  label,
  tone,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  label: string;
  tone: "expectation" | "reality";
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain" />
      <span
        className={cn(
          "absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm sm:text-[11px]",
          tone === "expectation" ? "bg-expectation" : "bg-reality",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/** Miniatura doble para listas compactas. */
export function WorkThumbs({ work, size = 56 }: { work: WorkDTO; size?: number }) {
  return (
    <div className="flex shrink-0 gap-1">
      {[work.expectationUrl, work.realityUrl].map((src, i) => (
        <div
          key={src}
          className={cn("relative overflow-hidden rounded-md border-2 bg-white", i === 0 ? "border-expectation/60" : "border-reality/60")}
          style={{ width: size, height: size }}
        >
          <Image src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover" />
        </div>
      ))}
    </div>
  );
}
