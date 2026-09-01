import Link from "next/link";
import { startOfDay, startOfMonth, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSlotLabel, STATUS_STYLES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const [todayBookings, upcoming, monthAgg, statusCounts, totalCustomers] = await Promise.all([
    prisma.booking.findMany({
      where: { startsAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } },
      include: { service: true, staff: true, customer: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { startsAt: { gt: todayEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { service: true, staff: true, customer: true },
      orderBy: { startsAt: "asc" },
      take: 8,
    }),
    prisma.booking.aggregate({
      where: { status: "COMPLETED", startsAt: { gte: monthStart } },
      _sum: { priceCents: true },
      _count: true,
    }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count])) as Record<string, number>;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={formatPrice(monthAgg._sum.priceCents ?? 0)} sub={`${monthAgg._count} completed visits`} />
        <StatCard label="Pending approval" value={String(statusMap.PENDING ?? 0)} sub="awaiting confirmation" accent="gold" />
        <StatCard label="Confirmed upcoming" value={String(statusMap.CONFIRMED ?? 0)} sub="on the books" accent="sage" />
        <StatCard label="Total customers" value={String(totalCustomers)} sub="registered accounts" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-xl text-ink">Today&rsquo;s appointments</h2>
          {todayBookings.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">Nothing scheduled today.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {todayBookings.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">Upcoming</h2>
            <Link href="/admin/bookings" className="btn-ghost">Manage all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">Nothing pending beyond today.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {upcoming.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: "gold" | "sage" }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accent === "gold" ? "text-gold" : accent === "sage" ? "text-sage" : "text-ink"}`}>{value}</p>
      <p className="mt-1 text-xs text-ink/40">{sub}</p>
    </div>
  );
}

function BookingRow({ booking }: { booking: any }) {
  return (
    <div className="card flex items-center justify-between p-3 text-sm">
      <div>
        <p className="font-medium text-ink">{booking.service.name} · {booking.customer.name}</p>
        <p className="text-xs text-ink/50">with {booking.staff.name} · {formatSlotLabel(booking.startsAt.toISOString())}</p>
      </div>
      <span className={`border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[booking.status]}`}>{booking.status}</span>
    </div>
  );
}
