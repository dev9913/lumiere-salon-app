import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { categoryUpsertSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = categoryUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, ...rest } = parsed.data;
  const category = await prisma.category.update({
    where: { id: params.id },
    data: { ...rest, ...(name ? { name, slug: slugify(name) } : {}) },
  });
  return NextResponse.json(category);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireRole("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceCount = await prisma.service.count({ where: { categoryId: params.id } });
  if (serviceCount > 0) {
    return NextResponse.json(
      { error: "Move or delete this category's services before deleting it." },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
