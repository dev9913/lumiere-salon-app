import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { categoryUpsertSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { services: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = categoryUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, slug: slugify(parsed.data.name) },
  });
  return NextResponse.json(category, { status: 201 });
}
