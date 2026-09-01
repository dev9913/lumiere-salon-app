import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata = { title: "Admin Login — Lumière Salon" };

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center bg-ink py-16">
      <div className="w-full max-w-sm border border-white/10 bg-parchment p-8">
        <p className="eyebrow">Staff access</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Admin Login</h1>
        <p className="mt-2 text-sm text-ink/60">Manage services, staff, and bookings.</p>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
