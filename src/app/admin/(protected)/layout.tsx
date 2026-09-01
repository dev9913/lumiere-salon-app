import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-parchment">
      <div className="border-b border-line bg-ink">
        <div className="container-page flex h-14 items-center justify-between">
          <span className="font-display text-lg text-parchment">Lumière <span className="text-gold">Admin</span></span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-parchment/60">{admin.name}</span>
            <LogoutButton scope="admin" />
          </div>
        </div>
      </div>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[200px_1fr]">
        <aside>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap px-3 py-2 text-sm font-medium text-ink/70 hover:bg-blush/60 hover:text-ink lg:whitespace-normal"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
