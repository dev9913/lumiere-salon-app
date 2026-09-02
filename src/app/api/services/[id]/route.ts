import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { serviceUpsertSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = serviceUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { staffIds, name, imageUrl, ...rest } = parsed.data;

  const service = await prisma.service.update({
    where: { id: id },
    data: {
      ...rest,
      ...(name ? { name, slug: slugify(name) } : {}),
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
      ...(staffIds
        ? {
            staff: {
              deleteMany: {},
              create: staffIds.map((staffId) => ({ staffId })),
            },
          }
        : {}),
    },
  });

  return NextResponse.json(service);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Services with existing bookings are deactivated instead of hard-deleted
  // so booking history stays intact.
  const bookingCount = await prisma.booking.count({ where: { serviceId: id } });
  if (bookingCount > 0) {
    const service = await prisma.service.update({ where: { id: id }, data: { isActive: false } });
    return NextResponse.json({ deactivated: true, service });
  }

  await prisma.service.delete({ where: { id: id } });
  return NextResponse.json({ deleted: true });
}
