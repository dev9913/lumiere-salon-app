import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatDuration } from "@/lib/utils";

export default function ServiceCard({
  categorySlug,
  slug,
  name,
  description,
  durationMins,
  priceCents,
  imageUrl,
}: {
  categorySlug: string;
  slug: string;
  name: string;
  description: string;
  durationMins: number;
  priceCents: number;
  imageUrl?: string | null;
}) {
  return (
    <Link href={`/services/${categorySlug}/${slug}`} className="card group flex overflow-hidden">
      {imageUrl && (
        <div className="relative hidden w-36 shrink-0 sm:block">
          <Image src={imageUrl} alt="" fill sizes="144px" className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h4 className="font-display text-base text-ink group-hover:text-rosewood">{name}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-ink/60">{description}</p>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink/50">{formatDuration(durationMins)}</span>
          <span className="font-semibold text-ink">{formatPrice(priceCents)}</span>
        </div>
      </div>
    </Link>
  );
}
