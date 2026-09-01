import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: "COMPLETED" },
        select: { priceCents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const shaped = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    totalBookings: c._count.bookings,
    lifetimeSpendCents: c.bookings.reduce((sum, b) => sum + b.priceCents, 0),
  }));

  return NextResponse.json(shaped);
}
