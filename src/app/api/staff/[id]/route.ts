import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { staffUpsertSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = staffUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { serviceIds, name, photoUrl, ...rest } = parsed.data;

  const staff = await prisma.staff.update({
    where: { id: id },
    data: {
      ...rest,
      ...(name ? { name, slug: slugify(name) } : {}),
      ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
      ...(serviceIds
        ? { services: { deleteMany: {}, create: serviceIds.map((serviceId) => ({ serviceId })) } }
        : {}),
    },
  });

  return NextResponse.json(staff);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookingCount = await prisma.booking.count({ where: { staffId: id } });
  if (bookingCount > 0) {
    const staff = await prisma.staff.update({ where: { id: id }, data: { isActive: false } });
    return NextResponse.json({ deactivated: true, staff });
  }

  await prisma.staff.delete({ where: { id: id } });
  return NextResponse.json({ deleted: true });
}
