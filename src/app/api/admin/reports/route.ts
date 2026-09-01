import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(0);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

  const completed = await prisma.booking.findMany({
    where: { status: "COMPLETED", startsAt: { gte: from, lte: to } },
    include: { service: { include: { category: true } }, staff: true },
  });

  const totalRevenueCents = completed.reduce((sum, b) => sum + b.priceCents, 0);

  const byCategory: Record<string, { name: string; revenueCents: number; count: number }> = {};
  const byStaff: Record<string, { name: string; revenueCents: number; count: number }> = {};
  const byService: Record<string, { name: string; revenueCents: number; count: number }> = {};

  for (const b of completed) {
    const cat = b.service.category;
    byCategory[cat.id] ??= { name: cat.name, revenueCents: 0, count: 0 };
    byCategory[cat.id].revenueCents += b.priceCents;
    byCategory[cat.id].count += 1;

    byStaff[b.staffId] ??= { name: b.staff.name, revenueCents: 0, count: 0 };
    byStaff[b.staffId].revenueCents += b.priceCents;
    byStaff[b.staffId].count += 1;

    byService[b.serviceId] ??= { name: b.service.name, revenueCents: 0, count: 0 };
    byService[b.serviceId].revenueCents += b.priceCents;
    byService[b.serviceId].count += 1;
  }

  return NextResponse.json({
    totalRevenueCents,
    totalCompletedBookings: completed.length,
    byCategory: Object.values(byCategory).sort((a, b) => b.revenueCents - a.revenueCents),
    byStaff: Object.values(byStaff).sort((a, b) => b.revenueCents - a.revenueCents),
    byService: Object.values(byService).sort((a, b) => b.revenueCents - a.revenueCents),
  });
}
