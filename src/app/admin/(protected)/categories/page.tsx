import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { services: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Categories</h1>
      <p className="mt-2 text-sm text-ink/60">Organize how services are grouped on the customer site.</p>
      <div className="mt-8">
        <CategoryManager
          initial={categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            icon: c.icon,
            sortOrder: c.sortOrder,
            serviceCount: c._count.services,
          }))}
        />
      </div>
    </div>
  );
}
