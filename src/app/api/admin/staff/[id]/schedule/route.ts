import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { scheduleUpsertSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const schedules = await prisma.weeklySchedule.findMany({
    where: { staffId: params.id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(schedules);
}

/** Replaces the full weekly schedule for a staff member in one call. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = scheduleUpsertSchema.safeParse({ ...body, staffId: params.id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  for (const entry of parsed.data.entries) {
    if (entry.endMin <= entry.startMin) {
      return NextResponse.json({ error: "Each day's end time must be after its start time." }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.weeklySchedule.deleteMany({ where: { staffId: params.id } }),
    prisma.weeklySchedule.createMany({
      data: parsed.data.entries.map((e) => ({ staffId: params.id, ...e })),
    }),
  ]);

  const schedules = await prisma.weeklySchedule.findMany({ where: { staffId: params.id } });
  return NextResponse.json(schedules);
}
