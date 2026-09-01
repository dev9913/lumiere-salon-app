import { prisma } from "@/lib/prisma";
import AvailabilityManager from "@/components/admin/AvailabilityManager";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage({ searchParams }: { searchParams: { staffId?: string } }) {
  const staff = await prisma.staff.findMany({ orderBy: { name: "asc" } });
  const activeStaffId = searchParams.staffId ?? staff[0]?.id;

  const [schedules, timeOff] = activeStaffId
    ? await Promise.all([
        prisma.weeklySchedule.findMany({ where: { staffId: activeStaffId }, orderBy: { dayOfWeek: "asc" } }),
        prisma.timeOff.findMany({
          where: { staffId: activeStaffId, date: { gte: new Date(new Date().toDateString()) } },
          orderBy: { date: "asc" },
        }),
      ])
    : [[], []];

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Availability</h1>
      <p className="mt-2 text-sm text-ink/60">
        Set each stylist&rsquo;s recurring weekly hours, then add one-off exceptions for vacations or extra shifts.
      </p>
      <div className="mt-8">
        <AvailabilityManager
          staff={staff.map((s) => ({ id: s.id, name: s.name }))}
          activeStaffId={activeStaffId ?? null}
          initialSchedules={schedules.map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek, startMin: s.startMin, endMin: s.endMin }))}
          initialTimeOff={timeOff.map((t) => ({
            id: t.id,
            date: t.date.toISOString().slice(0, 10),
            startMin: t.startMin,
            endMin: t.endMin,
            reason: t.reason,
          }))}
        />
      </div>
    </div>
  );
}
