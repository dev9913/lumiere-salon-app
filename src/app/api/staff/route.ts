import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { staffUpsertSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const admin = includeInactive ? await requireRole("ADMIN") : null;

  const staff = await prisma.staff.findMany({
    where: {
      ...(includeInactive && admin ? {} : { isActive: true }),
      ...(serviceId ? { services: { some: { serviceId } } } : {}),
    },
    include: { services: { include: { service: true } }, schedules: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(staff);
}

export async function POST(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = staffUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { serviceIds, ...data } = parsed.data;
  const staff = await prisma.staff.create({
    data: {
      ...data,
      photoUrl: data.photoUrl || null,
      slug: slugify(data.name),
      services: serviceIds ? { create: serviceIds.map((serviceId) => ({ serviceId })) } : undefined,
    },
  });

  return NextResponse.json(staff, { status: 201 });
}
