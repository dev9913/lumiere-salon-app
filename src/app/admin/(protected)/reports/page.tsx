import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const completed = await prisma.booking.findMany({
    where: { status: "COMPLETED" },
    include: { service: { include: { category: true } }, staff: true },
  });

  const totalRevenueCents = completed.reduce((sum, b) => sum + b.priceCents, 0);

  const groupBy = <T,>(getKey: (b: (typeof completed)[number]) => string, getLabel: (b: (typeof completed)[number]) => string) => {
    const map = new Map<string, { label: string; revenueCents: number; count: number }>();
    for (const b of completed) {
      const key = getKey(b);
      const existing = map.get(key) ?? { label: getLabel(b), revenueCents: 0, count: 0 };
      existing.revenueCents += b.priceCents;
      existing.count += 1;
      map.set(key, existing);
    }
    return [...map.values()].sort((a, b) => b.revenueCents - a.revenueCents);
  };

  const byCategory = groupBy((b) => b.service.categoryId, (b) => b.service.category.name);
  const byStaff = groupBy((b) => b.staffId, (b) => b.staff.name);
  const byService = groupBy((b) => b.serviceId, (b) => b.service.name);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Reports</h1>
      <p className="mt-2 text-sm text-ink/60">Revenue is recognized when an appointment is marked completed.</p>

      <div className="card mt-6 p-6">
        <p className="text-xs uppercase tracking-wide text-ink/50">All-time revenue</p>
        <p className="mt-2 font-display text-4xl text-ink">{formatPrice(totalRevenueCents)}</p>
        <p className="mt-1 text-xs text-ink/40">{completed.length} completed appointments</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <ReportTable title="By category" rows={byCategory} />
        <ReportTable title="By stylist" rows={byStaff} />
        <ReportTable title="By service" rows={byService} />
      </div>
    </div>
  );
}

function ReportTable({ title, rows }: { title: string; rows: { label: string; revenueCents: number; count: number }[] }) {
  return (
    <div>
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="mt-3 divide-y divide-line border-t border-line">
        {rows.length === 0 && <p className="py-3 text-sm text-ink/50">No data yet.</p>}
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-ink">{r.label}</span>
            <span className="text-right">
              <span className="font-medium text-ink">{formatPrice(r.revenueCents)}</span>{" "}
              <span className="text-xs text-ink/40">({r.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
