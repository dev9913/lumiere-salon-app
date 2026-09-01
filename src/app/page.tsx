import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import CategoryCard from "@/components/CategoryCard";
import StaffCard from "@/components/StaffCard";


export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, staff] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { services: true } } },
    }),
    prisma.staff.findMany({ where: { isActive: true }, take: 4 }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="container-page grid gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:py-32">
          <div>
            <p className="eyebrow !text-gold">Portland, Oregon · Est. 2014</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] text-parchment sm:text-5xl lg:text-6xl">
              Considered beauty, from the first cut to the last coat.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-parchment/70">
              Haircuts, color, skin care, nails, massage, and bridal styling — booked in minutes, delivered by
              stylists who treat your time like it matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book" className="btn-primary">
                Book an Appointment
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 border border-parchment/30 px-6 py-3 text-sm font-medium text-parchment transition hover:border-parchment"
              >
                Browse Services
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full max-w-md justify-self-end overflow-hidden lg:aspect-square">
            <Image
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80"
              alt="Stylist finishing a client's hair color at Lumière Salon"
              fill
              priority
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow">What we offer</p>
            <h2 className="mt-2 font-display text-3xl text-ink">Services by category</h2>
          </div>
          <Link href="/services" className="btn-ghost hidden sm:inline-flex">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard
              key={c.id}
              slug={c.slug}
              name={c.name}
              description={c.description}
              icon={c.icon}
              count={c._count.services}
            />
          ))}
        </div>
      </section>

      {/* Staff */}
      <section className="bg-blush/60 py-20">
        <div className="container-page">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">Meet the team</p>
              <h2 className="mt-2 font-display text-3xl text-ink">Stylists &amp; specialists</h2>
            </div>
            <Link href="/staff" className="btn-ghost hidden sm:inline-flex">
              Meet everyone →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {staff.map((s) => (
              <StaffCard key={s.id} slug={s.slug} name={s.name} title={s.title} bio={s.bio} photoUrl={s.photoUrl} />
            ))}
          </div>
        </div>
      </section>

      {/* Bridal CTA */}
      <section className="container-page py-20">
        <div className="grid items-center gap-10 border border-line bg-white/60 p-10 shadow-card lg:grid-cols-2 lg:p-16">
          <div>
            <p className="eyebrow">Bridal &amp; events</p>
            <h2 className="mt-2 font-display text-3xl text-ink">
              One studio, your whole party — hair, makeup, and skin prep in a single visit.
            </h2>
            <p className="mt-4 text-ink/60">
              Trial runs, day-of timelines, and on-site touch-ups for the bridal party. Reserve your date early —
              wedding season books out fast.
            </p>
            <Link href="/services/bridal-packages" className="btn-primary mt-6">
              View Bridal Packages
            </Link>
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80"
              alt="Bridal hair and makeup styling"
              fill
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
