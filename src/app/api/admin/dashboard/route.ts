import { NextResponse } from "next/server";
import { startOfDay, startOfMonth, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const [todayBookings, upcoming, monthCompleted, statusCounts, totalCustomers, totalBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { startsAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } },
      include: { service: true, staff: true, customer: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { startsAt: { gt: todayEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { service: true, staff: true, customer: true },
      orderBy: { startsAt: "asc" },
      take: 10,
    }),
    prisma.booking.aggregate({
      where: { status: "COMPLETED", startsAt: { gte: monthStart } },
      _sum: { priceCents: true },
      _count: true,
    }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.booking.count(),
  ]);

  return NextResponse.json({
    todayBookings,
    upcoming,
    monthRevenueCents: monthCompleted._sum.priceCents ?? 0,
    monthCompletedCount: monthCompleted._count,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    totalCustomers,
    totalBookings,
  });
}
