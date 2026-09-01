import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create Account — Lumière Salon" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-ink/60">Book faster and keep track of your appointments.</p>
        <div className="mt-8">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-rosewood hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
