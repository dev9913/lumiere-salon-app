import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.customerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "This booking is already cancelled." }, { status: 400 });
  }
  if (booking.status === "COMPLETED") {
    return NextResponse.json({ error: "Completed appointments can't be cancelled." }, { status: 400 });
  }

  const updated = await prisma.booking.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json(updated);
}
