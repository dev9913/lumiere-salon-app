import { prisma } from "@/lib/prisma";
import StaffCard from "@/components/StaffCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our Stylists — Lumière Salon" };

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <div className="container-page py-16">
      <p className="eyebrow">The team</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Stylists &amp; specialists</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        Every stylist trains continuously across color, cutting, and skin science. Pick a face you like, or let us
        match you to one during booking.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {staff.map((s) => (
          <StaffCard key={s.id} slug={s.slug} name={s.name} title={s.title} bio={s.bio} photoUrl={s.photoUrl} />
        ))}
      </div>
    </div>
  );
}
