import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { serviceUpsertSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const admin = includeInactive ? await requireRole("ADMIN") : null;

  const services = await prisma.service.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(includeInactive && admin ? {} : { isActive: true }),
    },
    include: { category: true, staff: { include: { staff: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = serviceUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { staffIds, ...data } = parsed.data;
  const service = await prisma.service.create({
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
      slug: slugify(data.name),
      staff: staffIds ? { create: staffIds.map((staffId) => ({ staffId })) } : undefined,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
