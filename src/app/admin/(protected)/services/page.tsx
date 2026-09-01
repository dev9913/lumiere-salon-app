import { prisma } from "@/lib/prisma";
import ServiceManager from "@/components/admin/ServiceManager";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const [services, categories, staff] = await Promise.all([
    prisma.service.findMany({ include: { category: true, staff: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.staff.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Services</h1>
      <p className="mt-2 text-sm text-ink/60">Add, edit, deactivate, or remove services from the menu.</p>
      <div className="mt-8">
        <ServiceManager
          initialServices={services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            durationMins: s.durationMins,
            priceCents: s.priceCents,
            imageUrl: s.imageUrl,
            isActive: s.isActive,
            categoryId: s.categoryId,
            categoryName: s.category.name,
            staffIds: s.staff.map((x) => x.staffId),
          }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          staff={staff.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </div>
  );
}
