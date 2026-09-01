import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Log In — Lumière Salon" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-ink/60">Log in to manage your appointments.</p>
        <div className="mt-8">
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 text-center text-sm text-ink/60">
          New here?{" "}
          <Link href="/signup" className="font-medium text-rosewood hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink/40">
          Salon staff? <Link href="/admin/login" className="hover:underline">Admin login</Link>
        </p>
      </div>
    </div>
  );
}
