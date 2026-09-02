
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ServiceCard from "@/components/ServiceCard";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: { services: { where: { isActive: true } } },
  });

  if (!category) notFound();

  return (
    <div className="container-page py-16">
      <Link href="/services" className="btn-ghost">
        ← All services
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-2xl">{category.icon}</span>
        <h1 className="font-display text-4xl text-ink">
          {category.name}
        </h1>
      </div>

      {category.description && (
        <p className="mt-3 max-w-xl text-ink/60">
          {category.description}
        </p>
      )}

      {category.services.length === 0 ? (
        <p className="mt-10 text-ink/50">
          No services in this category yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {category.services.map((s) => (
            <ServiceCard
              key={s.id}
              categorySlug={category.slug}
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
    </div>
  );
}
