import { prisma } from "@/lib/prisma";
import BookingManager from "@/components/admin/BookingManager";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status;
  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as any } : {},
    include: { service: true, staff: true, customer: true },
    orderBy: { startsAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Bookings</h1>
      <p className="mt-2 text-sm text-ink/60">Move appointments through pending → confirmed → completed, or cancel them.</p>
      <div className="mt-8">
        <BookingManager
          activeStatus={status ?? "ALL"}
          bookings={bookings.map((b) => ({
            id: b.id,
            status: b.status,
            startsAt: b.startsAt.toISOString(),
            priceCents: b.priceCents,
            serviceName: b.service.name,
            staffName: b.staff.name,
            customerName: b.customer.name,
            customerEmail: b.customer.email,
            notes: b.notes,
          }))}
        />
      </div>
    </div>
  );
}
