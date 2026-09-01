import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";

export const metadata = { title: "Book an Appointment — Lumière Salon" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: { service?: string; staff?: string };
}) {
  const user = await getCurrentUser();

  const [categories, staff] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { services: { where: { isActive: true }, include: { staff: true } } },
    }),
    prisma.staff.findMany({ where: { isActive: true }, include: { services: true } }),
  ]);

  return (
    <div className="container-page py-16">
      <p className="eyebrow">Reserve your visit</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Book an Appointment</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        Pick a service, choose a stylist, then grab any open slot in the next two weeks. You&rsquo;ll get an instant
        confirmation and can reschedule anytime from your account.
      </p>

      {!user && (
        <div className="mt-8 flex flex-wrap items-center gap-3 border border-gold/40 bg-gold/10 px-5 py-4 text-sm text-ink">
          <span>You&rsquo;ll need an account to complete booking.</span>
          <Link href="/login?next=/book" className="btn-ghost">Log in</Link>
          <span className="text-ink/30">or</span>
          <Link href="/signup?next=/book" className="btn-ghost">Create one — takes 30 seconds</Link>
        </div>
      )}

      <div className="mt-10">
        <BookingWizard
          categories={categories}
          staff={staff}
          isLoggedIn={!!user}
          initialServiceId={searchParams.service}
          initialStaffId={searchParams.staff}
        />
      </div>
    </div>
  );
}
