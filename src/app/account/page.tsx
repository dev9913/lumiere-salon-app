import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSlotLabel, STATUS_STYLES } from "@/lib/utils";
import LogoutButton from "@/components/LogoutButton";

export const metadata = { title: "My Account — Lumière Salon" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const upcoming = await prisma.booking.findMany({
    where: { customerId: user.id, status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { gte: new Date() } },
    include: { service: true, staff: true },
    orderBy: { startsAt: "asc" },
    take: 3,
  });

  return (
    <div className="container-page py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Hi, {user.name.split(" ")[0]}</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">Upcoming appointments</h2>
            <Link href="/account/bookings" className="btn-ghost">View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="card mt-4 p-6 text-sm text-ink/60">
              Nothing on the calendar yet. <Link href="/book" className="text-rosewood hover:underline">Book an appointment</Link>.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {upcoming.map((b) => (
                <div key={b.id} className="card flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-ink">{b.service.name}</p>
                    <p className="text-sm text-ink/50">with {b.staff.name} · {formatSlotLabel(b.startsAt.toISOString())}</p>
                  </div>
                  <span className={`border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card h-fit p-6">
          <h2 className="font-display text-lg text-ink">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ink/50">Name</dt>
              <dd className="font-medium text-ink">{user.name}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Email</dt>
              <dd className="font-medium text-ink">{user.email}</dd>
            </div>
            {user.phone && (
              <div>
                <dt className="text-ink/50">Phone</dt>
                <dd className="font-medium text-ink">{user.phone}</dd>
              </div>
            )}
          </dl>
          <Link href="/book" className="btn-primary mt-6 w-full">Book another visit</Link>
        </div>
      </div>
    </div>
  );
}
