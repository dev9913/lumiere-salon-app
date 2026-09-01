import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDuration } from "@/lib/utils";

export const revalidate = 60;

export default async function ServiceDetailPage({ params }: { params: { category: string; slug: string } }) {
  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
    include: { category: true, staff: { include: { staff: true } } },
  });

  if (!service || service.category.slug !== params.category) notFound();

  const eligibleStaff = service.staff.map((s) => s.staff).filter((s) => s.isActive);

  return (
    <div className="container-page py-16">
      <Link href={`/services/${service.category.slug}`} className="btn-ghost">
        ← Back to {service.category.name}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-blush lg:order-2">
          {service.imageUrl && (
            <Image src={service.imageUrl} alt={service.name} fill sizes="(min-width:1024px) 480px, 100vw" className="object-cover" />
          )}
        </div>

        <div className="lg:order-1">
          <p className="eyebrow">{service.category.name}</p>
          <h1 className="mt-2 font-display text-4xl text-ink">{service.name}</h1>
          <div className="mt-4 flex gap-6 text-sm">
            <span className="text-ink/60">{formatDuration(service.durationMins)}</span>
            <span className="font-semibold text-ink">{formatPrice(service.priceCents)}</span>
          </div>
          <p className="mt-6 leading-relaxed text-ink/70">{service.description}</p>

          <Link href={`/book?service=${service.id}`} className="btn-primary mt-8">
            Book this service
          </Link>

          {eligibleStaff.length > 0 && (
            <div className="mt-12">
              <p className="eyebrow">Performed by</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {eligibleStaff.map((s) => (
                  <Link
                    key={s.id}
                    href={`/staff/${s.slug}`}
                    className="flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm hover:border-rosewood"
                  >
                    <span className="relative h-7 w-7 overflow-hidden rounded-full bg-blush">
                      {s.photoUrl && <Image src={s.photoUrl} alt="" fill sizes="28px" className="object-cover" />}
                    </span>
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
