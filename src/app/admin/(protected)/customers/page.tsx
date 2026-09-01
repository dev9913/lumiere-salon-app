import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    include: {
      _count: { select: { bookings: true } },
      bookings: { where: { status: "COMPLETED" }, select: { priceCents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Customers</h1>
      <p className="mt-2 text-sm text-ink/60">{customers.length} registered account{customers.length === 1 ? "" : "s"}.</p>

      <form className="mt-6 flex gap-2" action="/admin/customers">
        <input name="q" defaultValue={q} placeholder="Search by name or email…" className="input-field max-w-sm" />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <div className="mt-6 divide-y divide-line border-t border-line">
        {customers.map((c) => {
          const lifetimeSpend = c.bookings.reduce((sum, b) => sum + b.priceCents, 0);
          return (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-ink">{c.name}</p>
                <p className="text-sm text-ink/50">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-right">
                  <p className="font-medium text-ink">{c._count.bookings}</p>
                  <p className="text-xs text-ink/40">bookings</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink">{formatPrice(lifetimeSpend)}</p>
                  <p className="text-xs text-ink/40">lifetime spend</p>
                </div>
              </div>
            </div>
          );
        })}
        {customers.length === 0 && <p className="py-6 text-sm text-ink/50">No customers found.</p>}
      </div>
    </div>
  );
}
