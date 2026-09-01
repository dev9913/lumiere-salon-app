import { prisma } from "@/lib/prisma";
import ServiceCard from "@/components/ServiceCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Services — Lumière Salon" };

export default async function ServicesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { services: { where: { isActive: true } } },
  });

  return (
    <div className="container-page py-16">
      <p className="eyebrow">Full menu</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Services</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        Every service includes a consultation. Prices reflect our standard rate — your stylist will confirm before
        you book if anything (long hair, extensive color correction) changes the estimate.
      </p>

      <div className="mt-12 space-y-16">
        {categories.map((cat) => (
          <section key={cat.id} id={cat.slug}>
            <div className="flex items-baseline gap-3">
              <span className="text-xl">{cat.icon}</span>
              <h2 className="font-display text-2xl text-ink">{cat.name}</h2>
            </div>
            {cat.description && <p className="mt-1 text-sm text-ink/60">{cat.description}</p>}
            {cat.services.length === 0 ? (
              <p className="mt-4 text-sm text-ink/40">Services coming soon.</p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {cat.services.map((s) => (
                  <ServiceCard
                    key={s.id}
                    categorySlug={cat.slug}
                    slug={s.slug}
                    name={s.name}
                    description={s.description}
                    durationMins={s.durationMins}
                    priceCents={s.priceCents}
                    imageUrl={s.imageUrl}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
