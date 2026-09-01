import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDuration } from "@/lib/utils";

export const revalidate = 60;

export default async function StaffDetailPage({ params }: { params: { slug: string } }) {
  const staff = await prisma.staff.findUnique({
    where: { slug: params.slug },
    include: { services: { include: { service: { include: { category: true } } } } },
  });

  if (!staff) notFound();

  return (
    <div className="container-page py-16">
      <Link href="/staff" className="btn-ghost">
        ← All stylists
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush">
          {staff.photoUrl && <Image src={staff.photoUrl} alt={staff.name} fill sizes="(min-width:1024px) 400px, 100vw" className="object-cover" />}
        </div>

        <div>
          <h1 className="font-display text-4xl text-ink">{staff.name}</h1>
          <p className="eyebrow mt-1">{staff.title}</p>
          <p className="mt-6 leading-relaxed text-ink/70">{staff.bio}</p>

          <Link href={`/book?staff=${staff.id}`} className="btn-primary mt-8">
            Book with {staff.name.split(" ")[0]}
          </Link>

          <div className="mt-12">
            <p className="eyebrow">Services offered</p>
            <div className="mt-3 divide-y divide-line border-t border-line">
              {staff.services.map(({ service }) => (
                <Link
                  key={service.id}
                  href={`/services/${service.category.slug}/${service.slug}`}
                  className="flex items-center justify-between py-3 text-sm hover:text-rosewood"
                >
                  <span>{service.name}</span>
                  <span className="text-ink/50">
                    {formatDuration(service.durationMins)} · {formatPrice(service.priceCents)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
