import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingHistoryList from "@/components/BookingHistoryList";

export const metadata = { title: "Booking History — Lumière Salon" };

export default async function BookingHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/bookings");

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.id },
    include: { service: true, staff: true },
    orderBy: { startsAt: "desc" },
  });

  // Serialize dates to ISO strings for the client component.
  const shaped = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    startsAt: b.startsAt.toISOString(),
    priceCents: b.priceCents,
    notes: b.notes,
    service: { id: b.service.id, name: b.service.name, durationMins: b.service.durationMins },
    staff: { id: b.staff.id, name: b.staff.name },
  }));

  return (
    <div className="container-page py-16">
      <p className="eyebrow">My account</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Booking history</h1>
      <p className="mt-3 max-w-xl text-ink/60">
        Cancel or reschedule anything that hasn&rsquo;t happened yet. Past visits stay here for your records.
      </p>

      <div className="mt-10">
        <BookingHistoryList bookings={shaped} />
      </div>
    </div>
  );
}
