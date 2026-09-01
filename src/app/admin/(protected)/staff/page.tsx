import { prisma } from "@/lib/prisma";
import StaffManager from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const [staff, services] = await Promise.all([
    prisma.staff.findMany({ include: { services: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Staff</h1>
      <p className="mt-2 text-sm text-ink/60">Manage stylist profiles and which services each person offers.</p>
      <div className="mt-8">
        <StaffManager
          initial={staff.map((s) => ({
            id: s.id,
            name: s.name,
            title: s.title,
            bio: s.bio,
            photoUrl: s.photoUrl,
            isActive: s.isActive,
            serviceIds: s.services.map((x) => x.serviceId),
          }))}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </div>
  );
}
