import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { timeOffSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const timeOff = await prisma.timeOff.findMany({
    where: { staffId: id, date: { gte: new Date(new Date().toDateString()) } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(timeOff);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = timeOffSchema.safeParse({ ...body, staffId: id });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const entry = await prisma.timeOff.create({
    data: {
      staffId: id,
      date: new Date(parsed.data.date + "T00:00:00.000Z"),
      startMin: parsed.data.startMin ?? null,
      endMin: parsed.data.endMin ?? null,
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entryId = searchParams.get("entryId");
  if (!entryId) return NextResponse.json({ error: "entryId is required" }, { status: 400 });

  await prisma.timeOff.delete({ where: { id: entryId } });
  return NextResponse.json({ deleted: true });
}
